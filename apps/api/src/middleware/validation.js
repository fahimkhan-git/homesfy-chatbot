import { body, validationResult } from "express-validator";

/**
 * Validation middleware - checks validation results
 */
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
}

/**
 * Sanitize string input - remove potentially dangerous characters
 */
export function sanitizeString(str) {
  if (typeof str !== "string") return str;
  return str
    .trim()
    .replace(/[<>]/g, "") // Remove < and > to prevent XSS
    .substring(0, 10000); // Limit length
}

/**
 * Chat endpoint validation
 */
export const validateChat = [
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 1, max: 5000 })
    .withMessage("Message must be between 1 and 5000 characters")
    .customSanitizer(sanitizeString),
  body("projectId")
    .trim()
    .notEmpty()
    .withMessage("projectId is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("projectId must be between 1 and 100 characters"),
  body("conversation")
    .optional()
    .isArray()
    .withMessage("conversation must be an array"),
  body("microsite")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("microsite must be less than 200 characters"),
  validate,
];

/**
 * Lead submission validation
 */
export const validateLead = [
  body("phone")
    .optional()
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage("Phone must be between 10 and 20 characters")
    .matches(/^\+?[\d\s()-]+$/)
    .withMessage("Phone must contain only digits, spaces, hyphens, parentheses, and optional +"),
  body("bhkType")
    .trim()
    .notEmpty()
    .withMessage("bhkType is required")
    .isIn([
      "1 Bhk",
      "1 BHK",
      "2 Bhk",
      "2 BHK",
      "3 Bhk",
      "3 BHK",
      "4 Bhk",
      "4 BHK",
      "Duplex",
      "Just Browsing",
      "Other",
      "Yet to decide",
    ])
    .withMessage("Invalid bhkType"),
  body("microsite")
    .trim()
    .notEmpty()
    .withMessage("microsite is required")
    .isLength({ max: 200 })
    .withMessage("microsite must be less than 200 characters"),
  body("metadata")
    .optional()
    .isObject()
    .withMessage("metadata must be an object"),
  body("conversation")
    .optional()
    .isArray()
    .withMessage("conversation must be an array"),
  validate,
];

/**
 * Event validation
 */
export const validateEvent = [
  body("type")
    .trim()
    .notEmpty()
    .withMessage("type is required")
    .isLength({ max: 50 })
    .withMessage("type must be less than 50 characters"),
  body("projectId")
    .trim()
    .notEmpty()
    .withMessage("projectId is required")
    .isLength({ max: 100 })
    .withMessage("projectId must be less than 100 characters"),
  body("microsite")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("microsite must be less than 200 characters"),
  body("payload")
    .optional()
    .isObject()
    .withMessage("payload must be an object"),
  validate,
];

/**
 * Widget config validation
 */
export const validateWidgetConfig = [
  body("agentName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("agentName must be less than 100 characters")
    .customSanitizer(sanitizeString),
  body("primaryColor")
    .optional()
    .trim()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage("primaryColor must be a valid hex color"),
  body("propertyInfo")
    .optional()
    .isObject()
    .withMessage("propertyInfo must be an object"),
  validate,
];

