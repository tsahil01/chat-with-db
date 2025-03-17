/**
 * Parses a response string to extract various components such as SQL queries,
 * JSON visualizations, or text responses.
 * 
 * @param data The string response to parse
 * @returns An object containing the extracted components
 */
export async function parseResponse(data: string) {
    // Define types for the return object
    interface ParsedResponse {
        generatedSQL?: string;
        visualization?: any;
        textResponse?: string;
        responseFormat?: string;
        chartType?: string;
    }

    const result: ParsedResponse = {};

    // Extract SQL query if present in generated_sql tags
    const sqlRegex = /<generated_sql>([\s\S]*?)<\/generated_sql>/;
    const sqlMatch = data.match(sqlRegex);
    if (sqlMatch && sqlMatch[1]) {
        result.generatedSQL = sqlMatch[1].trim();
        result.responseFormat = "sql";
    }

    // Extract response format from tags
    const formatRegex = /<response format="(.*?)">/;
    const formatMatch = data.match(formatRegex);
    if (formatMatch && formatMatch[1]) {
        result.responseFormat = formatMatch[1];
    }

    // Extract JSON visualization if present
    if (result.responseFormat === "json") {
        const jsonRegex = /<response format="json">([\s\S]*?)<\/response>/;
        const jsonMatch = data.match(jsonRegex);
        if (jsonMatch && jsonMatch[1]) {
            try {
                result.visualization = JSON.parse(jsonMatch[1].trim());
                // Extract chart type if it exists in the JSON
                if (result.visualization && result.visualization.chartType) {
                    result.chartType = result.visualization.chartType;
                }
            } catch (e) {
                console.error("Error parsing JSON visualization:", e);
            }
        }
    }

    // Extract text response if present
    if (result.responseFormat === "text") {
        const textRegex = /<response format="text">([\s\S]*?)<\/response>/;
        const textMatch = data.match(textRegex);
        if (textMatch && textMatch[1]) {
            result.textResponse = textMatch[1].trim().replace(/^"|"$/g, ''); // Remove surrounding quotes if present
        }
    }

    // Extract SQL from code blocks if no structured SQL was found
    if (!result.generatedSQL) {
        const codeBlockRegex = /```sql\s*([\s\S]*?)\s*```/;
        const codeBlockMatch = data.match(codeBlockRegex);
        if (codeBlockMatch && codeBlockMatch[1]) {
            result.generatedSQL = codeBlockMatch[1].trim();
            result.responseFormat = "sql";
        }
    }

    // Extract plain text response when no format tag is specified
    if (!result.responseFormat) {
        // Remove any existing tags to get plain text content
        const plainText = data.replace(/<[^>]*>/g, '').trim();
        if (plainText) {
            // If the plain text contains code blocks but we already extracted SQL,
            // remove the code blocks from the text response
            if (result.generatedSQL) {
                result.textResponse = plainText.replace(/```sql\s*[\s\S]*?\s*```/g, '').trim();
                if (result.textResponse) {
                    result.responseFormat = "text+sql";  // Indicate both text and SQL are present
                }
            } else {
                result.textResponse = plainText;
                result.responseFormat = "text";
            }
        }
    }

    return result;
}
