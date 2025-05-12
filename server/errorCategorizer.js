const axios = require("axios");

// Priority levels for error categorization
const PRIORITY_LEVELS = {
  P0: {
    label: "Most Critical",
    description: "System inoperability, security breach, complete app failure",
  },
  P1: {
    label: "Critical",
    description:
      "Core functionality blocked, UI blocked, component load failure, JS chunk load error",
  },
  P2: {
    label: "Good to Resolve",
    description:
      "Minor UI issues, runtime type errors, background non-severe file load errors, css errors",
  },
};

// Function to get LLM categorization with enhanced context
const getLLMCategorization = async (error) => {
  try {
    // Prepare error context for LLM
    const errorContext = {
      type: error.type || "Unknown",
      name: error.name || "Unknown",
      message: error.message || "Unknown",
      stack: error.stack || "None",
      componentStack: error.componentStack || "None",
      browser: error.deviceInfo?.userAgent,
      environment: error.deviceInfo?.platform,
      url: error.pageInfo?.url,
      timestamp: error.timestamp || new Date().toISOString(),
    };

    const prompt = `You are an error analysis expert. Analyze this client-side web application error and categorize its priority level. Respond with ONLY a JSON object, no other text.

Error Context:
${JSON.stringify(errorContext, null, 2)}

Categorization Guidelines:
1. Most Critical (P0) - System inoperability, security breach, complete app failure
   - Complete system or browser crash
   - Security vulnerabilities or unauthorized access
   - Critical data loss or corruption
   - Examples: Memory leaks, stack overflow, security breaches

2. Critical (P1) - Core functionality blocked, UI blocked, component load failure
   - Core features or critical functionality blocked
   - Main UI components or views blocked
   - Critical JavaScript bundle or component load failures
   - Examples: JS chunk load errors, critical API failures, main component errors

3. Good to Resolve (P2) - Minor UI, runtime type errors, background non-severe errors
   - Non-critical runtime errors
   - Minor UI glitches or styling issues
   - Background operations or non-critical feature errors
   - Examples: Type errors, reference errors, CSS load errors

Required JSON Response Format (respond with ONLY this JSON object):
{
  "priority": "P0|P1|P2",
  "confidence": 0.0-1.0,
  "explanation": "Detailed explanation of the categorization",
  "impact": {
    "user": "Impact on user experience",
    "business": "Impact on business operations",
    "technical": "Technical severity and scope"
  },
  "recommendations": ["List of recommended actions"]
}

IMPORTANT: 
- Respond with ONLY the JSON object, no other text
- Be conservative in assigning P0 - only use for complete system failures or security breaches
- Ensure the response is valid JSON`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "deepseek-r1-distill-llama-70b",
        messages: [
          {
            role: "system",
            content:
              "You are a JSON-only response bot. Always respond with a single, valid JSON object matching the requested format. Never include any other text, markdown, or explanation. Never use markdown code blocks or backticks.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = response.data.choices[0].message.content;

    // Clean the response to ensure it's valid JSON
    const cleanResult = result.trim().replace(/^```json\s*|\s*```$/g, "");

    try {
      const parsedResult = JSON.parse(cleanResult);

      // Validate required fields
      const requiredFields = [
        "priority",
        "confidence",
        "explanation",
        "impact",
        "recommendations",
      ];
      const missingFields = requiredFields.filter(
        (field) => !parsedResult[field]
      );

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      }

      // Validate priority
      if (!["P0", "P1", "P2"].includes(parsedResult.priority)) {
        throw new Error(`Invalid priority value: ${parsedResult.priority}`);
      }

      // Validate confidence
      const confidence = parseFloat(parsedResult.confidence);
      if (isNaN(confidence) || confidence < 0 || confidence > 1) {
        throw new Error(`Invalid confidence value: ${parsedResult.confidence}`);
      }

      // Validate impact object
      const requiredImpactFields = ["user", "business", "technical"];
      const missingImpactFields = requiredImpactFields.filter(
        (field) => !parsedResult.impact[field]
      );

      if (missingImpactFields.length > 0) {
        throw new Error(
          `Missing required impact fields: ${missingImpactFields.join(", ")}`
        );
      }

      // Validate recommendations array
      if (
        !Array.isArray(parsedResult.recommendations) ||
        parsedResult.recommendations.length === 0
      ) {
        throw new Error("Recommendations must be a non-empty array");
      }

      return {
        ...parsedResult,
        confidence: confidence,
        method: "llm_analysis",
      };
    } catch (parseError) {
      console.error("Failed to parse LLM response:", parseError);
      console.error("Raw response:", result);
      console.error("Cleaned response:", cleanResult);

      // Return a default categorization with error details
      return {
        priority: "P2",
        confidence: 0.5,
        explanation: `Error in parsing LLM response: ${parseError.message}. Using default categorization.`,
        impact: {
          user: "Unable to analyze due to parsing error",
          business: "Unable to analyze due to parsing error",
          technical: "Unable to analyze due to parsing error",
        },
        recommendations: [
          "Review error logs for more details",
          "Check LLM response format",
        ],
        method: "llm_parse_error",
        parseError: parseError.message,
        rawResponse: result,
      };
    }
  } catch (error) {
    console.error("LLM categorization failed:", error);
    return {
      priority: "P2",
      confidence: 0.5,
      explanation: `LLM categorization failed: ${error.message}. Using default categorization.`,
      impact: {
        user: "Unable to analyze due to LLM failure",
        business: "Unable to analyze due to LLM failure",
        technical: "Unable to analyze due to LLM failure",
      },
      recommendations: [
        "Review error logs for more details",
        "Check LLM service status",
      ],
      method: "llm_failure",
      error: error.message,
    };
  }
};

// Main categorization function
const categorizeError = async (error) => {
  return await getLLMCategorization(error);
};

module.exports = {
  categorizeError,
  PRIORITY_LEVELS,
};
