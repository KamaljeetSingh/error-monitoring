import axios from "axios";

// Priority levels with their descriptions
export const PRIORITY_LEVELS = {
  P0: {
    label: "Critical",
    description:
      "Requires immediate attention. Affects core functionality, data integrity, or security. Business critical.",
    color: "#dc2626", // Red
    icon: "🔴",
  },
  P1: {
    label: "High",
    description:
      "Major impact on user experience. Affects significant portion of users or important features. Should be fixed in current sprint.",
    color: "#f97316", // Orange
    icon: "🟠",
  },
  P2: {
    label: "Medium",
    description:
      "Moderate impact on user experience. Limited to specific features or edge cases. Should be fixed in next few sprints.",
    color: "#eab308", // Yellow
    icon: "🟡",
  },
  P3: {
    label: "Low",
    description:
      "Minor issues with minimal impact. Cosmetic issues or very rare edge cases. Can be addressed when resources permit.",
    color: "#22c55e", // Green
    icon: "🟢",
  },
};

// Enhanced heuristic rules with confidence scores and context
const HEURISTIC_RULES = [
  {
    priority: "P0",
    confidence: 0.9,
    conditions: [
      // Security related errors
      {
        test: (error) =>
          error.message?.toLowerCase().includes("security") ||
          error.message?.toLowerCase().includes("authentication") ||
          error.message?.toLowerCase().includes("authorization"),
        context:
          "Security-related errors are critical as they may expose vulnerabilities",
        weight: 1.0,
      },
      // Data integrity errors
      {
        test: (error) =>
          error.message?.toLowerCase().includes("data corruption") ||
          error.message?.toLowerCase().includes("data integrity"),
        context:
          "Data integrity errors can lead to permanent data loss or corruption",
        weight: 1.0,
      },
      // Critical system errors
      {
        test: (error) =>
          error.name === "SecurityError" ||
          error.name === "QuotaExceededError" ||
          error.message?.includes("Maximum call stack size exceeded"),
        context: "System-level errors that can crash the application",
        weight: 0.9,
      },
      // Payment related errors
      {
        test: (error) =>
          error.message?.toLowerCase().includes("payment") ||
          error.message?.toLowerCase().includes("transaction"),
        context:
          "Payment processing errors directly impact business operations",
        weight: 0.95,
      },
    ],
  },
  {
    priority: "P1",
    confidence: 0.8,
    conditions: [
      // Network errors affecting core functionality
      {
        test: (error) =>
          (error.name === "NetworkError" ||
            error.message?.includes("Network Error")) &&
          !error.message?.includes("resource"),
        context: "Network errors can disrupt core functionality",
        weight: 0.8,
      },
      // Critical feature errors
      {
        test: (error) =>
          error.message?.toLowerCase().includes("cannot read property") ||
          error.message?.toLowerCase().includes("undefined is not a function"),
        context: "Critical feature errors can lead to application crashes",
        weight: 0.8,
      },
      // Authentication errors
      {
        test: (error) =>
          error.message?.toLowerCase().includes("session expired") ||
          error.message?.toLowerCase().includes("invalid token"),
        context: "Authentication errors can prevent access to resources",
        weight: 0.8,
      },
    ],
  },
  {
    priority: "P2",
    confidence: 0.7,
    conditions: [
      // Resource loading errors
      {
        test: (error) =>
          error.message?.includes("Failed to load resource") ||
          error.message?.includes("Loading chunk failed"),
        context: "Resource loading errors can disrupt user experience",
        weight: 0.7,
      },
      // UI rendering errors
      {
        test: (error) =>
          error.message?.includes("React") &&
          (error.message?.includes("render") ||
            error.message?.includes("component")),
        context: "UI rendering errors can disrupt user experience",
        weight: 0.7,
      },
      // API errors for non-critical features
      {
        test: (error) =>
          error.name === "AxiosError" &&
          !error.message?.includes("Network Error"),
        context: "API errors can disrupt non-critical features",
        weight: 0.7,
      },
    ],
  },
  {
    priority: "P3",
    confidence: 0.6,
    conditions: [
      // Console warnings
      {
        test: (error) =>
          error.name === "Warning" || error.severity === "warning",
        context: "Console warnings can indicate potential issues",
        weight: 0.6,
      },
      // Deprecation warnings
      {
        test: (error) => error.message?.toLowerCase().includes("deprecated"),
        context: "Deprecation warnings indicate outdated code",
        weight: 0.6,
      },
      // Performance warnings
      {
        test: (error) =>
          error.message?.toLowerCase().includes("performance") ||
          error.message?.toLowerCase().includes("slow"),
        context: "Performance warnings indicate potential slowdowns",
        weight: 0.6,
      },
    ],
  },
];

// Function to analyze error using heuristics with confidence scoring
const analyzeWithHeuristics = (error) => {
  const results = {
    P0: { score: 0, matches: [], context: [] },
    P1: { score: 0, matches: [], context: [] },
    P2: { score: 0, matches: [], context: [] },
    P3: { score: 0, matches: [], context: [] },
  };

  HEURISTIC_RULES.forEach((rule) => {
    rule.conditions.forEach((condition) => {
      if (condition.test(error)) {
        const score = rule.confidence * condition.weight;
        results[rule.priority].score += score;
        results[rule.priority].matches.push({
          condition: condition.context,
          score,
        });
        results[rule.priority].context.push(condition.context);
      }
    });
  });

  // Normalize scores
  Object.keys(results).forEach((priority) => {
    results[priority].score =
      results[priority].score / (results[priority].matches.length || 1);
  });

  return results;
};

// Function to get LLM categorization with enhanced context
const getLLMCategorization = async (error, heuristicResults = {}) => {
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
    };

    // Prepare heuristic analysis for LLM
    const heuristicAnalysis = Object.entries(heuristicResults)
      .map(([priority, data]) => ({
        priority,
        score: data.score,
        matches: data.matches,
        context: data.context,
      }))
      .filter((data) => data.score > 0)
      .sort((a, b) => b.score - a.score);

    const prompt = `You are an expert JavaScript error analyst. Analyze this error and provide a structured response in the following JSON format:

{
  "priority": "P0|P1|P2|P3",
  "confidence": 0.0-1.0,
  "explanation": "Detailed explanation of categorization",
  "heuristicAlignment": "How this aligns with heuristic analysis",
  "impactAnalysis": "Breakdown of impact on different aspects",
  "recommendations": "Specific recommendations for handling"
}

Priority Details: 
${JSON.stringify(PRIORITY_LEVELS)}

Error Details:
${JSON.stringify(errorContext, null, 2)}

Consider these factors:
1. Impact on user experience and business operations
2. Security implications and data integrity
3. Error frequency and scope
4. Browser/environment context
5. Stack trace patterns
6. Heuristic analysis results
7. Modern web app error patterns
8. Framework-specific considerations
9. Browser compatibility
10. Performance impact

Context:
- Client-side error monitoring system
- Production web application
- Modern web development practices
- Browser environment and user context
- Immediate and long-term impacts

IMPORTANT: Respond with ONLY the JSON object, no other text or explanation.`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "deepseek-r1-distill-llama-70b",
        messages: [
          {
            role: "system",
            content:
              "You are a JSON-only response bot. Always respond with valid JSON matching the requested format. Never include any other text or explanation.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1, // Lower temperature for more consistent output
        max_tokens: 1000,
        response_format: { type: "json_object" }, // Force JSON response
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = response.data.choices[0].message.content;

    try {
      // Parse the JSON response
      const parsedResult = JSON.parse(result);

      // Validate the response format
      if (
        !parsedResult.priority ||
        !parsedResult.confidence ||
        !parsedResult.explanation
      ) {
        throw new Error("Invalid response format");
      }

      // Validate priority value
      if (!["P0", "P1", "P2", "P3"].includes(parsedResult.priority)) {
        throw new Error("Invalid priority value");
      }

      // Validate confidence value
      const confidence = parseFloat(parsedResult.confidence);
      if (isNaN(confidence) || confidence < 0 || confidence > 1) {
        throw new Error("Invalid confidence value");
      }

      return {
        ...parsedResult,
        confidence: confidence, // Ensure it's a number
        rawResponse: result, // Keep the raw response for debugging
      };
    } catch (parseError) {
      console.error("Failed to parse LLM response:", parseError);
      console.error("Raw response:", result);

      // Fallback to a safe default
      return {
        priority: "P2",
        confidence: 0.5,
        explanation:
          "Error in parsing LLM response. Using default categorization.",
        heuristicAlignment: "No heuristic alignment available",
        impactAnalysis: "Unable to analyze impact due to parsing error",
        recommendations: "Review error logs for more details",
        method: "llm_parse_error",
        rawResponse: result,
      };
    }
  } catch (error) {
    console.error("LLM categorization failed:", error);
    return null;
  }
};

// Main categorization function with hybrid approach
export const categorizeError = async (error) => {
  // Step 1: Analyze with heuristics
  const heuristicResults = analyzeWithHeuristics(error);

  // Step 2: Get LLM categorization with heuristic context
  const llmResult = await getLLMCategorization(error, heuristicResults);
  console.log("llmResult -- ", llmResult);

  if (!llmResult) {
    // Fallback to highest scoring heuristic if LLM fails
    const highestHeuristic = Object.entries(heuristicResults).reduce(
      (highest, [priority, data]) =>
        data.score > highest.score ? { priority, ...data } : highest,
      { priority: "P2", score: 0 }
    );

    return {
      priority: highestHeuristic.priority,
      explanation: `Categorized using heuristic rules: ${highestHeuristic.context.join(
        ", "
      )}`,
      method: "heuristic_fallback",
      confidence: highestHeuristic.score,
      matches: highestHeuristic.matches,
    };
  }

  // Step 3: Combine results intelligently
  const finalPriority = llmResult.priority;
  const heuristicScore = heuristicResults[finalPriority]?.score || 0;

  // If LLM confidence is high and aligns with heuristics, use LLM result
  if (llmResult.confidence > 0.8 && heuristicScore > 0.5) {
    return {
      ...llmResult,
      method: "hybrid_high_confidence",
      heuristicScore,
    };
  }

  // If LLM confidence is low but heuristics are strong, use heuristic result
  if (llmResult.confidence < 0.6 && heuristicScore > 0.7) {
    const heuristicData = heuristicResults[finalPriority];
    return {
      priority: finalPriority,
      explanation: `Strong heuristic match: ${heuristicData.context.join(
        ", "
      )}. LLM suggested same priority but with lower confidence.`,
      method: "hybrid_heuristic_preferred",
      confidence: heuristicScore,
      llmSuggestion: llmResult,
      matches: heuristicData.matches,
    };
  }

  // Default to LLM result with heuristic context
  return {
    ...llmResult,
    method: "hybrid_llm_preferred",
    heuristicScore,
    heuristicContext: heuristicResults[finalPriority]?.context || [],
  };
};
