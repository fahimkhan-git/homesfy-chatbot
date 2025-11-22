import express from "express";
import { getWidgetConfig } from "../storage/widgetConfigStore.js";
import { chatLimiter } from "../middleware/rateLimiter.js";
import { validateChat } from "../middleware/validation.js";

const router = express.Router();

// Initialize Gemini AI - lazy load to handle missing API key gracefully
let genAI = null;
let GoogleGenerativeAI = null;

async function initializeAI() {
  if (genAI !== null && genAI !== false) return genAI; // Already initialized
  if (genAI === false) return null; // Already attempted and failed
  
  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-key-here') {
      console.warn("⚠️  GEMINI_API_KEY not set or using placeholder value.");
      console.warn("   AI chat will use fallback keyword matching instead of Gemini AI.");
      console.warn("   To enable full AI capabilities, set GEMINI_API_KEY in .env file");
      genAI = false; // Mark as attempted but failed
      return null;
    }
    
    console.log("🔧 Initializing Gemini AI (gemini-2.5-flash)...");
    const module = await import("@google/generative-ai");
    GoogleGenerativeAI = module.GoogleGenerativeAI;
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("✅ Gemini AI initialized successfully - full AI capabilities enabled");
    return genAI;
  } catch (error) {
    console.error("❌ Failed to initialize Google Generative AI:", error.message);
    console.warn("   Falling back to keyword matching responses");
    genAI = false; // Mark as attempted but failed
    return null;
  }
}

// Apply rate limiting and validation to chat endpoint
router.post("/", chatLimiter, validateChat, async (req, res) => {
  try {
    const { message, conversation, projectId, microsite, selectedCta, selectedBhk, propertyInfo: clientPropertyInfo } = req.body;

    // Validation already handled by validateChat middleware
    // Additional checks if needed
    if (!message || !projectId) {
      return res.status(400).json({ error: "Message and projectId are required" });
    }

    // Fetch widget config and property information FIRST
    // projectId is now auto-detected from domain, ensuring project-specific data
    const widgetConfig = await getWidgetConfig(projectId);
    // Use client-provided propertyInfo if available (auto-detected from page), otherwise use config
    const propertyInfo = clientPropertyInfo && Object.keys(clientPropertyInfo).length > 0 
      ? clientPropertyInfo 
      : (widgetConfig.propertyInfo || {});
    const agentName = widgetConfig.agentName || "Riya";
    
    console.log("Chat API: Project ID:", projectId, "Domain/Microsite:", microsite);
    console.log("Chat API: Received propertyInfo:", propertyInfo ? Object.keys(propertyInfo) : 'none');
    console.log("Chat API: Message:", message);

    // Initialize AI if not already done
    const ai = await initializeAI();
    
    // Log AI availability status clearly
    if (!ai) {
      console.warn("⚠️  Chat API: Gemini AI not available - GEMINI_API_KEY not set or invalid. Using fallback responses.");
      console.warn("   To enable full AI capabilities, set GEMINI_API_KEY in .env file");
    } else {
      console.log("✅ Chat API: Gemini AI (gemini-2.5-flash) is available and will be used");
    }
    
    // If AI is not available, return smart fallback based on property info
    if (!ai) {
      console.log("Chat API: Using smart fallback (keyword matching)");
      // Use property info to give a helpful fallback response
      const hasPropertyInfo = propertyInfo && Object.keys(propertyInfo).length > 0;
      
      if (hasPropertyInfo && message) {
        const lowerMessage = message.toLowerCase().trim();
        const lastUserMessage = conversation && conversation.length > 0 
          ? conversation[conversation.length - 1]?.text?.toLowerCase() || ''
          : '';
        const contextMessage = lastUserMessage || lowerMessage;
        
        // Log that we're using fallback
        console.log("⚠️  Chat API: Fallback mode - keyword matching for:", lowerMessage.substring(0, 50));
        
        // Handle simple responses like "yes", "no", "ok", "sure"
        if (['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'alright', 'fine', 'correct', 'right'].includes(lowerMessage)) {
          // Look at last AGENT message to understand what they're saying yes to
          const lastAgentMessage = conversation && conversation.length > 0
            ? conversation.filter(m => m.type === 'agent').slice(-1)[0]?.text?.toLowerCase() || ''
            : '';
          
          // Check what the agent just asked about - check for specific follow-up questions first
          // If agent asked "Would you like to know about pricing or schedule a site visit?" after location
          if (lastAgentMessage.includes('would you like to know about') && (lastAgentMessage.includes('pricing') || lastAgentMessage.includes('site visit'))) {
            // They're saying yes to the follow-up question about pricing/site visit
            const bhkText = propertyInfo.availableBhk && Array.isArray(propertyInfo.availableBhk) && propertyInfo.availableBhk.length > 0
              ? propertyInfo.availableBhk.join(' and ')
              : 'various configurations';
            const pricingText = propertyInfo.pricing && typeof propertyInfo.pricing === 'object' && Object.keys(propertyInfo.pricing).length > 0
              ? Object.entries(propertyInfo.pricing).map(([bhk, price]) => `${bhk}: ${price}`).join(', ')
              : 'Check with our team for current pricing';
            const response = `Great! We have ${bhkText} available. Our pricing: ${pricingText}. Would you like to schedule a site visit or get more details?`;
            return res.json({ response, aiUsed: false, fallback: true });
          }
          
          // If agent just provided location info and asked a follow-up
          if (lastAgentMessage.includes('located in') || (lastAgentMessage.includes('location') && lastAgentMessage.includes('would you like'))) {
            // They said yes to location question - follow up with pricing or BHK
            const bhkText = propertyInfo.availableBhk && Array.isArray(propertyInfo.availableBhk) && propertyInfo.availableBhk.length > 0
              ? propertyInfo.availableBhk.join(' and ')
              : 'various configurations';
            const pricingInfo = propertyInfo.pricing && Object.keys(propertyInfo.pricing).length > 0
              ? `Pricing starts from ${Object.values(propertyInfo.pricing)[0]}. `
              : '';
            const response = `Great! We have ${bhkText} available. ${pricingInfo}Would you like to know more about the configurations or schedule a site visit?`;
            return res.json({ response, aiUsed: false, fallback: true });
          }
          
          // If agent asked specifically about pricing
          if (lastAgentMessage.includes('pricing') && lastAgentMessage.includes('would you') && !lastAgentMessage.includes('location')) {
            // They said yes to pricing question - offer to connect
          const response = `Excellent! I'd love to help you with the best pricing and payment plans. Share your name and phone so our team can reach out with exclusive offers.`;
          return res.json({ response, aiUsed: false, fallback: true });
          }
          
          if (lastAgentMessage.includes('bhk') || lastAgentMessage.includes('configuration') || lastAgentMessage.includes('bedroom')) {
            // They said yes to BHK - provide pricing
            const pricingText = propertyInfo.pricing && typeof propertyInfo.pricing === 'object' && Object.keys(propertyInfo.pricing).length > 0
              ? Object.entries(propertyInfo.pricing).map(([bhk, price]) => `${bhk}: ${price}`).join(', ')
              : 'Check with our team for current pricing';
            const response = `Perfect! Our pricing: ${pricingText}. Would you like to schedule a site visit or get more details? Share your name and phone.`;
          return res.json({ response, aiUsed: false, fallback: true });
          }
          
          // Generic yes response - continue conversation naturally
          const response = `That's great! ${propertyInfo.pricing && Object.keys(propertyInfo.pricing).length > 0 
            ? `Would you like to know about our pricing or available configurations?` 
            : `Would you like to know more about ${propertyInfo.projectName || 'this project'}?`} Share your name and phone so I can assist you better.`;
          return res.json({ response, aiUsed: false, fallback: true });
        }
        
        // Handle "no" responses
        if (['no', 'nope', 'not', "don't", 'nah'].includes(lowerMessage)) {
          const response = `No worries! Is there anything else about ${propertyInfo.projectName || 'the project'} you'd like to know? I'm here to help!`;
          return res.json({ response, aiUsed: false, fallback: true });
        }
        
        // Handle greetings
        if (['hi', 'hello', 'hey', 'hello there', 'hi there'].includes(lowerMessage)) {
          const projectText = propertyInfo.projectName 
            ? `I'm here to help you with ${propertyInfo.projectName}.` 
            : "I'm here to help you find your dream home.";
          const response = `Hi! 👋 I'm ${agentName} from Homesfy. ${projectText} What would you like to know?`;
          return res.json({ response, aiUsed: false, fallback: true });
        }
        
        // Smart fallback based on question
        if (lowerMessage.includes('project name') || lowerMessage.includes('name of project') || lowerMessage.includes('what is this') || lowerMessage.includes('what project')) {
          const response = propertyInfo.projectName 
            ? `This is ${propertyInfo.projectName}${propertyInfo.developer ? ` by ${propertyInfo.developer}` : ''}${propertyInfo.location ? ` located in ${propertyInfo.location}` : ''}. Would you like to know more about pricing or available configurations?`
            : "I'd love to help you with that! Share your name and phone so I can assist you better.";
          return res.json({ response, aiUsed: false, fallback: true });
        }
        
        if (lowerMessage.includes('cost') || lowerMessage.includes('price') || lowerMessage.includes('pricing') || lowerMessage.includes('how much')) {
          const pricingText = propertyInfo.pricing && typeof propertyInfo.pricing === 'object' && Object.keys(propertyInfo.pricing).length > 0
            ? Object.entries(propertyInfo.pricing).map(([bhk, price]) => `${bhk}: ${price}`).join(', ')
            : 'Check with our team for current pricing';
          const response = `Our pricing: ${pricingText}. Would you like to schedule a site visit or get more details? Share your name and phone.`;
          return res.json({ response, aiUsed: false, fallback: true });
        }
        
        if (lowerMessage.includes('location') || lowerMessage.includes('where') || lowerMessage.includes('address') || lowerMessage.includes('situated')) {
          const response = propertyInfo.location
            ? `${propertyInfo.projectName || 'This project'} is located in ${propertyInfo.location}. ${propertyInfo.availableBhk && Array.isArray(propertyInfo.availableBhk) && propertyInfo.availableBhk.length > 0 
              ? `We have ${propertyInfo.availableBhk.join(' and ')} available. ` 
              : ''}Would you like to know about pricing or schedule a site visit?`
            : "I'd love to help you with that! Share your name and phone so I can assist you better.";
          return res.json({ response, aiUsed: false, fallback: true });
        }
        
        if (lowerMessage.includes('bhk') || lowerMessage.includes('configuration') || lowerMessage.includes('bedroom') || lowerMessage.includes('room')) {
          const bhkText = propertyInfo.availableBhk && Array.isArray(propertyInfo.availableBhk) && propertyInfo.availableBhk.length > 0
            ? propertyInfo.availableBhk.join(' and ')
            : 'various configurations';
          const response = `We have ${bhkText} available. ${propertyInfo.pricing && Object.keys(propertyInfo.pricing).length > 0 
            ? `Would you like to know about pricing? ` 
            : ''}Share your name and phone so I can assist you better.`;
          return res.json({ response, aiUsed: false, fallback: true });
        }
        
        // Handle amenities questions
        if (lowerMessage.includes('amenit') || lowerMessage.includes('facilit') || lowerMessage.includes('feature') || lowerMessage.includes('what do you have')) {
          const amenitiesText = propertyInfo.amenities && Array.isArray(propertyInfo.amenities) && propertyInfo.amenities.length > 0
            ? propertyInfo.amenities.slice(0, 8).join(', ')
            : 'modern amenities';
          const response = `We offer ${amenitiesText}${propertyInfo.amenities && propertyInfo.amenities.length > 8 ? ' and more' : ''}. Would you like to know about pricing or schedule a site visit?`;
          return res.json({ response, aiUsed: false, fallback: true });
        }
      }
      
      // Intelligent fallback - search through property info and provide helpful response
      const lowerMessage = message.toLowerCase().trim();
      
      // Handle "brief details", "highlights", "overview" requests intelligently
      // Check for various ways users might ask for project information
      const isBriefRequest = lowerMessage.includes('brief') || 
                            lowerMessage.includes('breif') || // common typo
                            lowerMessage.includes('detail') || 
                            lowerMessage.includes('highlight') || 
                            lowerMessage.includes('overview') || 
                            lowerMessage.includes('tell me about') || 
                            lowerMessage.includes('about the project') ||
                            lowerMessage.includes('about this project') ||
                            lowerMessage.includes('can give') && (lowerMessage.includes('brief') || lowerMessage.includes('breif') || lowerMessage.includes('detail')) ||
                            lowerMessage.includes('give me') && (lowerMessage.includes('brief') || lowerMessage.includes('breif') || lowerMessage.includes('detail') || lowerMessage.includes('info'));
      
      if (isBriefRequest) {
        const highlights = [];
        if (propertyInfo.projectName) highlights.push(`${propertyInfo.projectName}`);
        if (propertyInfo.developer) highlights.push(`by ${propertyInfo.developer}`);
        if (propertyInfo.location) highlights.push(`located in ${propertyInfo.location}`);
        if (propertyInfo.availableBhk && Array.isArray(propertyInfo.availableBhk) && propertyInfo.availableBhk.length > 0) {
          highlights.push(`available in ${propertyInfo.availableBhk.join(' and ')} configurations`);
        }
        if (propertyInfo.pricing && typeof propertyInfo.pricing === 'object' && Object.keys(propertyInfo.pricing).length > 0) {
          const pricingList = Object.entries(propertyInfo.pricing).map(([bhk, price]) => `${bhk}: ${price}`).join(', ');
          highlights.push(`pricing ranges from ${pricingList}`);
        }
        if (propertyInfo.amenities && Array.isArray(propertyInfo.amenities) && propertyInfo.amenities.length > 0) {
          const topAmenities = propertyInfo.amenities.slice(0, 5).join(', ');
          highlights.push(`key amenities include ${topAmenities}`);
        }
        if (propertyInfo.specialOffers && propertyInfo.specialOffers !== 'None' && propertyInfo.specialOffers.trim()) {
          highlights.push(`special offer: ${propertyInfo.specialOffers}`);
        }
        
        if (highlights.length > 0) {
          // Format response naturally with better structure
          let response = highlights.join('. ');
          // Add area if available
          if (propertyInfo.area && propertyInfo.area !== 'Not specified') {
            response += `. The project offers ${propertyInfo.area} of living space`;
          }
          response += '. Would you like to know more about pricing, configurations, or schedule a site visit?';
          return res.json({ response: response.replace(/\.\s*\./g, '.').replace(/\s+/g, ' ').trim(), aiUsed: false, fallback: true });
        }
      }
      
      // Handle location-specific queries
      if (lowerMessage.includes('location') || lowerMessage.includes('where') || lowerMessage.includes('situated') || lowerMessage.includes('nearby')) {
        const locationParts = [];
        if (propertyInfo.location) {
          locationParts.push(`${propertyInfo.projectName || 'The project'} is located in ${propertyInfo.location}`);
        }
        if (propertyInfo.availableBhk && Array.isArray(propertyInfo.availableBhk) && propertyInfo.availableBhk.length > 0) {
          locationParts.push(`We have ${propertyInfo.availableBhk.join(' and ')} available`);
        }
        if (locationParts.length > 0) {
          const response = `${locationParts.join('. ')}. Would you like to know about pricing or schedule a site visit?`;
          return res.json({ response, aiUsed: false, fallback: true });
        }
      }
      
      // Generic fallback - be more conversational, use exact phrase that triggers input mode
      const fallbackResponse = conversation && conversation.length > 2
        ? "That's interesting! Share your name and phone so I can connect you with our team."
        : "I'd love to help you with that! What would you like to know about the project?";
      return res.json({ response: fallbackResponse, aiUsed: false, fallback: true });
    }

    // Gemini AI is available - use full AI capabilities
    console.log("✅ Chat API: Using Gemini AI (gemini-2.5-flash) for intelligent response generation");
    console.log("   Property context includes:", Object.keys(propertyInfo).length, "fields");
    console.log("   Conversation history:", (conversation || []).length, "messages");

    // Use gemini-2.5-flash (latest flash model) or fallback to gemini-2.0-flash
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build property context string
    const availableBhk = propertyInfo.availableBhk 
      ? (Array.isArray(propertyInfo.availableBhk) ? propertyInfo.availableBhk.join(", ") : String(propertyInfo.availableBhk))
      : "Not specified";

    const amenities = propertyInfo.amenities 
      ? (Array.isArray(propertyInfo.amenities) ? propertyInfo.amenities.join(", ") : String(propertyInfo.amenities))
      : "Not specified";

    // Handle pricing - can be Map, Object, or string
    let pricingText = "Not specified";
    if (propertyInfo.pricing) {
      if (propertyInfo.pricing instanceof Map) {
        pricingText = Array.from(propertyInfo.pricing.entries())
          .map(([bhk, price]) => `${bhk}: ${price}`)
          .join(", ");
      } else if (typeof propertyInfo.pricing === "object") {
        pricingText = Object.entries(propertyInfo.pricing)
          .map(([bhk, price]) => `${bhk}: ${price}`)
          .join(", ");
      }
    }

        // Build comprehensive property context for AI to search through
        const propertyContext = `
    PROPERTY INFORMATION - Search through this information to answer user questions intelligently:
    
    BASIC DETAILS:
    - Project Name: ${propertyInfo.projectName || "Not specified"}
    - Developer: ${propertyInfo.developer || "Not specified"}
    - Location: ${propertyInfo.location || "Not specified"}
    - Area: ${propertyInfo.area || "Not specified"}
    - Possession: ${propertyInfo.possession || "Not specified"}
    
    CONFIGURATIONS & PRICING:
    - Available Configurations: ${availableBhk}
    - Pricing Details: ${pricingText}
    
    AMENITIES & FEATURES:
    - Amenities: ${amenities}
    
    SPECIAL OFFERS & HIGHLIGHTS:
    - Special Offers: ${propertyInfo.specialOffers || "None"}
    
    IMPORTANT: When user asks for "brief details", "highlights", "project overview", or "tell me about the project":
    - Intelligently extract and present the most important information
    - Include: project name, location advantage, available configurations, pricing range, key amenities, special offers
    - Present it naturally and conversationally
    
    When user asks about location or "what's nearby":
    - Provide the exact location
    - Think about what makes that location special (connectivity, growth potential, nearby facilities)
    - Mention nearby highlights if relevant to the conversation
    
    When user asks specific questions:
    - Search through ALL the information above
    - Find the most relevant details
    - Connect related information naturally
    - If information is "Not specified", say you'll connect them with the team for that detail
    `.trim();

    // Build conversation history
    const conversationHistory = (conversation || [])
      .slice(-8) // Last 8 messages for context
      .map(msg => `${msg.type === "user" ? "User" : "Agent"}: ${msg.text}`)
      .join("\n");

    // Enhanced system prompt for intelligent, sales-focused AI that converts leads quickly
    const systemPrompt = `You are ${agentName}, a top-performing property sales expert from Homesfy. You're warm, persuasive, and excellent at converting leads quickly. Your goal is to get the user's name and phone number as fast as possible while being helpful and attractive.

${propertyContext}

YOUR ROLE AS A SALES-FOCUSED PROFESSIONAL:
- You're a skilled salesperson who knows how to close leads quickly
- Answer their question briefly, then smoothly guide them toward sharing contact details
- Create urgency and value - mention special offers, limited availability, exclusive deals
- Be persuasive but friendly - like a confident sales expert who genuinely wants to help
- Keep responses SHORT (2-3 sentences max) with **bold** key terms
- After 1-2 exchanges, start asking for name and phone number
- Make it attractive and compelling - show them what they'll get by sharing details

HOW TO RESPOND (SALES-FOCUSED RULES):
1. KEEP IT SHORT - 2-3 sentences max, be concise and direct
2. USE BOLD FOR KEY INFO - Always bold: **project name**, **location**, **2 BHK**, **3 BHK**, **price**, **₹**, **amenities**, **developer**, **special offers**
3. ANSWER THEN ASK FOR CONTACT - After answering their question, smoothly ask for name/phone
4. CREATE URGENCY/VALUE - Mention special offers, limited availability, exclusive deals, best pricing
5. BE PERSUASIVE - Use phrases like "Let me get you the best deal", "I'll send you exclusive offers", "Our team will call with special pricing"
6. COUNT CONVERSATION TURNS - After 1-2 exchanges, start asking for contact details
7. MAKE IT ATTRACTIVE - Show benefits: "Get best pricing", "Exclusive offers", "Schedule site visit", "Expert consultation"
8. BE FRIENDLY BUT DIRECT - Like a confident salesperson who wants to help them get the best deal
9. Use 1 emoji max when appropriate (💰, ✨, 🏠, 📞)

SALES-FOCUSED RESPONSE EXAMPLES (2-3 SENTENCES, GUIDE TO CONTACT):
- First exchange: "**Nivasa Enchante** in **Dhanori - Lohegaon, Pune** offers **2 BHK** from **₹ 79.80 Lakhs** and **3 BHK** from **₹ 1.04 Cr**. Special offer: **Pay 20% Now & Rest on Possession**! 💰 Share your name and phone, I'll get you the best deal."
- After 1-2 exchanges: "Great! To send you **exclusive pricing** and schedule a site visit, share your name and phone. Our expert will call you with the best offers."
- User asks price: "**2 BHK**: **₹ 79.80 Lakhs**, **3 BHK**: **₹ 1.04 Cr** with **Pay 20% Now** offer. Share your name and phone, I'll connect you with our team for **special discounts**."
- User asks location: "**Dhanori - Lohegaon, Pune** - great connectivity and growth area! We have **2 BHK** and **3 BHK** available. Share your name and phone, I'll send you location highlights and pricing."

CRITICAL SALES RULES - CONVERT LEADS QUICKLY:
1. ALWAYS use **bold** for: project name, location, BHK, prices, amenities, special offers
2. KEEP RESPONSES SHORT - 2-3 sentences max, be concise
3. GUIDE TO CONTACT - After answering, ask for name/phone smoothly
4. CREATE VALUE - Mention "best pricing", "exclusive offers", "special deals", "expert consultation"
5. COUNT EXCHANGES - After 1-2 user messages, start asking for contact details
6. BE PERSUASIVE - Use phrases like "Let me get you...", "I'll send you...", "Our team will call with..."
7. IF NAME GIVEN - Acknowledge warmly and immediately ask for phone number
8. IF PHONE GIVEN - Thank them and confirm next steps
9. BE ATTRACTIVE - Show benefits, create urgency, make it compelling
10. BE SIMPLE - Use everyday language, no jargon

Current context:
- User interest: ${selectedCta || "general inquiry"}
- Selected BHK: ${selectedBhk || "not selected yet"}
- Microsite: ${microsite || "unknown"}
- Conversation length: ${(conversation || []).length} messages

LEAD GENERATION STRATEGY:
1. FIRST MESSAGE: Answer their question + mention value/offer + ask for name/phone
2. AFTER 1-2 EXCHANGES: Always ask for contact details with compelling reason
3. IF THEY HESITATE: Reassure them, mention benefits, make it easy
4. BE PERSISTENT BUT FRIENDLY - Like a good salesperson who genuinely wants to help

CRITICAL RULES - CONVERT LEADS:
1. MAXIMUM 2-3 SENTENCES - Keep it short and focused
2. USE **bold** for ALL key terms: **project name**, **location**, **2 BHK**, **3 BHK**, **₹ price**, **amenities**, **special offers**
3. ANSWER THEN ASK - Answer their question, then smoothly ask for name/phone
4. CREATE VALUE - Mention "best pricing", "exclusive offers", "special deals", "expert call"
5. COUNT MESSAGES - If conversation has 2+ user messages, definitely ask for contact
6. BE PERSUASIVE - Use: "Share your name and phone, I'll...", "Let me get you...", "Our team will call with..."
7. SIMPLE LANGUAGE - Everyday words, no jargon
8. IF NAME GIVEN - "Thanks [name]! What's your phone number? Our expert will call with best offers."

PERFECT SALES EXAMPLES (2-3 SENTENCES MAX - MUST ASK FOR NAME AND PHONE):
- First response: "**Nivasa Enchante** in **Dhanori - Lohegaon, Pune** offers **2 BHK** from **₹ 79.80 Lakhs** and **3 BHK** from **₹ 1.04 Cr**. Share your name and phone number, I'll get you **exclusive pricing**! 💰"
- After 1 exchange: "**2 BHK**: **₹ 79.80 Lakhs**, **3 BHK**: **₹ 1.04 Cr**. Share your name and phone number for **best deals** and expert consultation."
- Location question: "**Dhanori - Lohegaon, Pune** - great connectivity! Share your name and phone number, I'll send **location highlights** and **best pricing**."
- BHK question: "We have **2 BHK** and **3 BHK** available. Share your name and phone number, our expert will call with **special offers**."

CRITICAL RULES - FOLLOW EXACTLY:
1. EXACTLY 2-3 SENTENCES - Count them! Stop at 2 or 3 sentences maximum
2. Sentence 1: Answer their question with key info in **bold** (project, location, BHK, price)
3. Sentence 2: MUST ask for name and phone with compelling reason
4. Sentence 3 (optional): Only if absolutely needed for clarity

CRITICAL - SMART INPUT SWITCHING: Use JSON to trigger structured form

When you need to collect the user's name and phone number, you MUST use JSON format to trigger the lead capture form.
This ensures clean, validated data goes to the CRM instead of messy text.

JSON FORMAT (when asking for contact):
{
  "type": "request_lead_details",
  "message": "Your friendly message asking for contact details"
}

Example JSON responses:
{
  "type": "request_lead_details",
  "message": "I'd love to send you **exclusive pricing**! Please share your contact details below."
}

{
  "type": "request_lead_details",
  "message": "Great! To schedule a site visit and get **best deals**, please enter your name and phone number."
}

WHEN TO USE JSON vs PLAIN TEXT:
- USE JSON: When user shows interest, asks about pricing, wants site visit, or after 1-2 exchanges
- USE PLAIN TEXT: When just answering questions, user already provided details, or continuing conversation

IMPORTANT RULES:
1. Use JSON with "type": "request_lead_details" ONLY when asking for name and phone
2. The "message" should be friendly, persuasive, mention value (exclusive offers, best pricing, site visit)
3. Keep message to 1-2 sentences max with **bold** key terms
4. If just answering questions without needing contact, use plain text (no JSON)
5. After user provides name/phone, switch back to plain text responses

DECISION FLOW:
- User asks about property → Answer with plain text
- User shows interest → Use JSON to trigger form
- User provided details → Acknowledge with plain text
- After 1-2 exchanges without contact → Use JSON to trigger form

Now respond. If asking for contact details, use JSON. Otherwise, use plain text:`;

    // Check conversation length to determine if we should ask for contact
    // Count AGENT responses (not user messages) - ask after agent's second response
    const conversationArray = conversation || [];
    // Count how many times the agent has responded (system/assistant messages)
    const agentResponseCount = conversationArray.filter(msg => 
      msg.type === "system" || msg.type === "assistant" || (msg.type === "user" === false)
    ).length;
    
    // Also count from conversationHistory string if available
    let totalAgentResponses = agentResponseCount;
    if (conversationHistory) {
      // Count agent responses in the conversation history string
      const historyText = typeof conversationHistory === 'string' ? conversationHistory : JSON.stringify(conversationHistory);
      const agentMatches = historyText.match(/Agent:|assistant:|system:/gi);
      if (agentMatches) {
        totalAgentResponses = agentMatches.length;
      }
    }
    
    // Ask for contact after agent's second response (after agent has responded 2 times)
    // Also check if conversation has 2+ messages total as fallback
    const shouldAskForContact = totalAgentResponses >= 2 || conversationArray.length >= 2;
    
    console.log("Chat API: Agent response count:", totalAgentResponses, "Conversation length:", conversationArray.length, "Should ask for contact:", shouldAskForContact);
    
    const contactPrompt = shouldAskForContact 
      ? "CRITICAL: You have already responded to the user at least twice. You MUST ask for contact details in THIS response. Respond with JSON: {\"type\": \"request_lead_details\", \"message\": \"Your persuasive message asking for name and phone\"}. Make it compelling with exclusive offers, best pricing, or site visit. Always use JSON format to trigger the lead capture form."
      : "Answer their question briefly and accurately. This is your first or second response, so provide helpful information. Do NOT ask for contact details yet.";
    
    const fullPrompt = `${systemPrompt}\n\n${conversationHistory ? `Conversation so far:\n${conversationHistory}\n\n` : ""}${contactPrompt}\n\nUser: ${message}\n\nAgent (respond in 2-3 sentences, **bold** key terms, guide to contact):`;

    console.log("🤖 Chat API: Sending request to Gemini AI with full property context...");
    
    // Configure generation for sales-focused, persuasive but concise responses
    const generationConfig = {
      maxOutputTokens: 75, // Very strict limit for 2-3 sentences with contact ask
      temperature: 0.7, // Balanced creativity for persuasive but natural language
    };
    
    const result = await model.generateContent(fullPrompt, { generationConfig });
    const response = result.response;
    const aiText = response.text().trim();
    
    console.log("✅ Chat API: Received AI response from Gemini (length:", aiText.length, "chars)");

    // Try to parse JSON response for structured actions
    let parsedResponse = null;
    let responseText = aiText;
    let actionType = null;
    
    try {
      // Check if response starts with JSON or contains JSON object
      const trimmedText = aiText.trim();
      
      // Case 1: Response is pure JSON
      if (trimmedText.startsWith('{') && trimmedText.endsWith('}')) {
        parsedResponse = JSON.parse(trimmedText);
      } 
      // Case 2: JSON embedded in text (extract first valid JSON object)
      else {
        const jsonMatch = aiText.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        }
      }
      
      // Validate parsed response has the expected structure
      if (parsedResponse && typeof parsedResponse === 'object') {
        if (parsedResponse.type === "request_lead_details") {
          actionType = "request_lead_details";
          responseText = parsedResponse.message || aiText;
          console.log("✅ Chat API: Detected request_lead_details action from AI");
          console.log("   Message:", responseText.substring(0, 100));
        }
      }
    } catch (parseError) {
      // Not JSON or invalid JSON, treat as plain text
      console.log("Chat API: Response is plain text, not JSON:", parseError.message);
    }

    // Return response with action type if detected
    const responsePayload = { 
      response: responseText,
      aiUsed: true,
      model: "gemini-2.5-flash"
    };
    
    if (actionType) {
      responsePayload.action = actionType;
    }
    
    res.json(responsePayload);
  } catch (error) {
    console.error("❌ Chat API: Error processing request:", error.message);
    // Fallback response on error - use exact phrase that triggers input mode
    // Don't expose error details in production
    const errorMessage = process.env.NODE_ENV === 'development' ? error.message : undefined;
    res.status(500).json({ 
      response: "I'd love to help you with that! Share your name and phone so I can assist you better.",
      aiUsed: false,
      fallback: true,
      ...(errorMessage && { error: errorMessage })
    });
  }
});

export default router;
