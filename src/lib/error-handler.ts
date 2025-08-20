export interface AIErrorDetails {
  message: string;
  isRetryable: boolean;
  userAction?: string;
}

export function parseAIError(error: any): AIErrorDetails {
  const errorStr = error instanceof Error ? error.message : String(error);
  const errorObj = error?.data?.error || error?.error || {};
  
  // Log detailed error information for debugging
  console.log('Parsing AI error:', {
    errorStr,
    errorObj,
    errorType: error?.constructor?.name,
    hasData: !!error?.data,
    hasError: !!error?.error
  });
  
  // Check for Google Gemini API specific errors
  if (errorObj.status === 'RESOURCE_EXHAUSTED' || errorObj.code === 429) {
    if (errorObj.message?.includes('quota') || errorObj.message?.includes('exceeded')) {
      return {
        message: 'You have reached your API quota limit for today.',
        isRetryable: false,
        userAction: 'Please check your billing plan or try again tomorrow. You can also switch to a different AI model if available.'
      };
    }
    return {
      message: 'The AI service is currently experiencing high demand.',
      isRetryable: true,
      userAction: 'Please wait a moment and try again.'
    };
  }

  // Check for Google Gemini API quota exceeded (specific error from your log)
  if (errorObj.message?.includes('You exceeded your current quota') || 
      errorObj.message?.includes('free_tier_requests') ||
      errorObj.details?.some((detail: any) => detail['@type']?.includes('QuotaFailure'))) {
    
    // Extract specific quota information if available
    let quotaInfo = '';
    if (errorObj.details) {
      const quotaFailure = errorObj.details.find((detail: any) => detail['@type']?.includes('QuotaFailure'));
      if (quotaFailure?.violations?.[0]) {
        const violation = quotaFailure.violations[0];
        quotaInfo = `\n\n**Quota Details:**\n- Limit: ${violation.quotaValue} ${violation.quotaMetric?.split('/').pop() || 'requests'}\n- Model: ${violation.quotaDimensions?.model || 'Unknown'}`;
      }
    }
    
    return {
      message: 'You have reached your free tier API quota limit for today.',
      isRetryable: false,
      userAction: `You have used all your free requests for today. Please upgrade your plan or try again tomorrow. You can also switch to a different AI model if available.${quotaInfo}`
    };
  }

  // Check for rate limiting
  if (errorStr.includes('rate limit') || errorStr.includes('quota') || errorStr.includes('RESOURCE_EXHAUSTED')) {
    return {
      message: 'You have reached your API rate limit.',
      isRetryable: true,
      userAction: 'Please wait a moment and try again, or check your API usage limits.'
    };
  }

  // Check for authentication issues
  if (errorStr.includes('invalid key') || errorStr.includes('authentication') || errorStr.includes('unauthorized') || errorObj.code === 401) {
    return {
      message: 'There was an issue with the AI service authentication.',
      isRetryable: false,
      userAction: 'Please check your API key settings and try again.'
    };
  }

  // Check for model availability issues
  if (errorStr.includes('model not found') || errorStr.includes('invalid model') || errorStr.includes('not available') || errorObj.code === 400) {
    return {
      message: 'The selected AI model is currently unavailable.',
      isRetryable: false,
      userAction: 'Please try a different model or contact support.'
    };
  }

  // Check for timeout issues
  if (errorStr.includes('timeout') || errorStr.includes('timed out') || errorStr.includes('deadline')) {
    return {
      message: 'The request took too long to process.',
      isRetryable: true,
      userAction: 'Please try again with a shorter message or wait a moment.'
    };
  }

  // Check for content policy violations
  if (errorStr.includes('content policy') || errorStr.includes('safety') || errorStr.includes('blocked')) {
    return {
      message: 'Your request was blocked due to content policy restrictions.',
      isRetryable: false,
      userAction: 'Please rephrase your request and try again.'
    };
  }

  // Check for network/connection issues
  if (errorStr.includes('network') || errorStr.includes('connection') || errorStr.includes('fetch')) {
    return {
      message: 'There was a network connection issue.',
      isRetryable: true,
      userAction: 'Please check your internet connection and try again.'
    };
  }

  // Check for server errors
  if (errorObj.code >= 500 || errorStr.includes('internal server error') || errorStr.includes('server error')) {
    return {
      message: 'The AI service is experiencing technical difficulties.',
      isRetryable: true,
      userAction: 'Please wait a moment and try again. This is a server-side issue.'
    };
  }

  // Check for bad request errors
  if (errorObj.code === 400 || errorStr.includes('bad request') || errorStr.includes('invalid request')) {
    return {
      message: 'The request format was invalid.',
      isRetryable: false,
      userAction: 'Please check your message and try again with a different approach.'
    };
  }

  // Default error for unknown issues
  return {
    message: 'I encountered an unexpected issue while processing your request.',
    isRetryable: true,
    userAction: 'Please try again. If the problem persists, contact support.'
  };
}

export function formatErrorMessage(errorDetails: AIErrorDetails): string {
  let message = `**${errorDetails.message}**`;
  
  if (errorDetails.userAction) {
    message += `\n\n${errorDetails.userAction}`;
  }
  
  if (errorDetails.isRetryable) {
    message += '\n\n💡 **Tip:** This issue may resolve itself, so please try again.';
  } else {
    message += '\n\n⚠️ **Note:** This issue requires action on your part to resolve.';
  }
  
  // Add specific help for quota issues
  if (errorDetails.message.includes('quota') || errorDetails.message.includes('limit')) {
    message += '\n\n🔧 **Quick Solutions:**\n1. Switch to a different AI model\n2. Wait until tomorrow (quota resets daily)\n3. Check your API key billing status\n4. Consider upgrading your plan';
  }
  
  return message;
}

export function shouldRetry(error: any): boolean {
  const errorDetails = parseAIError(error);
  return errorDetails.isRetryable;
}

export function getRetryDelay(error: any): number {
  const errorObj = error?.data?.error || error?.error || {};
  
  // Check for retry info in Google Gemini API errors
  if (errorObj.details) {
    const retryInfo = errorObj.details.find((detail: any) => detail['@type']?.includes('RetryInfo'));
    if (retryInfo?.retryDelay) {
      // Parse retry delay (e.g., "49s" -> 49 seconds)
      const match = retryInfo.retryDelay.match(/(\d+)s/);
      if (match) {
        return parseInt(match[1]) * 1000; // Convert to milliseconds
      }
    }
  }
  
  // Default retry delay
  return 5000; // 5 seconds
} 