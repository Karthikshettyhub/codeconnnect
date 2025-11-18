// src/services/pistonService.js
// FREE API - No API key needed, unlimited requests!
import axios from 'axios';

const PISTON_API = 'https://emkc.org/api/v2/piston';

/**
 * Language configurations for Piston API
 */
export const LANGUAGE_CONFIGS = {
  javascript: { language: 'javascript', version: '18.15.0', alias: 'js' },
  python: { language: 'python', version: '3.10.0', alias: 'py' },
  java: { language: 'java', version: '15.0.2', alias: 'java' },
  cpp: { language: 'c++', version: '10.2.0', alias: 'cpp' },
  c: { language: 'c', version: '10.2.0', alias: 'c' },
  csharp: { language: 'csharp', version: '6.12.0', alias: 'cs' },
  go: { language: 'go', version: '1.16.2', alias: 'go' },
  rust: { language: 'rust', version: '1.68.2', alias: 'rs' },
  typescript: { language: 'typescript', version: '5.0.3', alias: 'ts' },
  ruby: { language: 'ruby', version: '3.0.1', alias: 'rb' },
  php: { language: 'php', version: '8.2.3', alias: 'php' },
  kotlin: { language: 'kotlin', version: '1.8.20', alias: 'kt' },
  swift: { language: 'swift', version: '5.3.3', alias: 'swift' }
};

/**
 * Execute code using Piston API (FREE - No API Key Required!)
 */
export const executeCode = async (code, language, input = '') => {
  try {
    const langConfig = LANGUAGE_CONFIGS[language.toLowerCase()];
    
    if (!langConfig) {
      throw new Error(
        `Language "${language}" is not supported. Supported: ${Object.keys(LANGUAGE_CONFIGS).join(', ')}`
      );
    }

    console.log('🚀 Executing with Piston API (FREE)...');
    console.log('Language:', langConfig.language);
    console.log('Version:', langConfig.version);

    const response = await axios.post(`${PISTON_API}/execute`, {
      language: langConfig.language,
      version: langConfig.version,
      files: [
        {
          name: `main.${langConfig.alias}`,
          content: code
        }
      ],
      stdin: input,
      args: [],
      compile_timeout: 10000,
      run_timeout: 3000,
      compile_memory_limit: -1,
      run_memory_limit: -1
    }, {
      timeout: 10000 // 10 second timeout
    });

    const result = response.data;

    console.log('✅ Execution complete');

    // Check for compilation errors
    if (result.compile && result.compile.code !== 0) {
      return {
        success: false,
        output: '',
        error: result.compile.stderr || result.compile.output || 'Compilation failed',
        executionTime: 0,
        memory: 0,
        status: 'Compilation Error',
        language: langConfig.language,
        version: langConfig.version
      };
    }

    // Check for runtime errors
    if (result.run && result.run.code !== 0 && result.run.signal) {
      return {
        success: false,
        output: result.run.stdout || '',
        error: result.run.stderr || `Runtime error (Signal: ${result.run.signal})`,
        executionTime: result.run.time || 0,
        memory: result.run.memory || 0,
        status: 'Runtime Error',
        language: langConfig.language,
        version: langConfig.version
      };
    }

    // Success case
    return {
      success: true,
      output: result.run.stdout || '',
      error: result.run.stderr || '',
      executionTime: result.run.time || 0,
      memory: result.run.memory || 0,
      status: 'Accepted',
      language: langConfig.language,
      version: langConfig.version
    };

  } catch (error) {
    console.error('❌ Piston API Error:', error);

    // Handle network errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        success: false,
        output: '',
        error: 'Request timeout. Your code took too long to execute (max 3s).',
        executionTime: 0,
        memory: 0,
        status: 'Timeout'
      };
    }

    if (error.response) {
      return {
        success: false,
        output: '',
        error: error.response.data?.message || `Server error: ${error.response.status}`,
        executionTime: 0,
        memory: 0,
        status: 'Error'
      };
    }

    return {
      success: false,
      output: '',
      error: error.message || 'Network error. Please check your connection.',
      executionTime: 0,
      memory: 0,
      status: 'Error'
    };
  }
};

/**
 * Get file extension for language
 */
export const getFileExtension = (language) => {
  const config = LANGUAGE_CONFIGS[language.toLowerCase()];
  return config ? config.alias : 'txt';
};

/**
 * Get starter code template for a language
 */
export const getStarterCode = (language) => {
  const templates = {
    javascript: `// JavaScript (Node.js 18.15.0)
console.log("Hello, World!");

// Your code here
const sum = (a, b) => a + b;
console.log("Sum:", sum(5, 3));`,

    python: `# Python 3.10.0
print("Hello, World!")

# Your code here
def sum_numbers(a, b):
    return a + b

print("Sum:", sum_numbers(5, 3))`,

    java: `public class main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // Your code here
        int sum = 5 + 3;
        System.out.println("Sum: " + sum);
    }
}`,

    cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    
    // Your code here
    int sum = 5 + 3;
    cout << "Sum: " << sum << endl;
    
    return 0;
}`,

    c: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    
    // Your code here
    int sum = 5 + 3;
    printf("Sum: %d\\n", sum);
    
    return 0;
}`,

    csharp: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
        
        // Your code here
        int sum = 5 + 3;
        Console.WriteLine($"Sum: {sum}");
    }
}`,

    go: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
    
    // Your code here
    sum := 5 + 3
    fmt.Printf("Sum: %d\\n", sum)
}`,

    rust: `fn main() {
    println!("Hello, World!");
    
    // Your code here
    let sum = 5 + 3;
    println!("Sum: {}", sum);
}`,

    typescript: `// TypeScript 5.0.3
console.log("Hello, World!");

// Your code here
const sum = (a: number, b: number): number => a + b;
console.log("Sum:", sum(5, 3));`,

    ruby: `# Ruby 3.0.1
puts "Hello, World!"

# Your code here
def sum(a, b)
  a + b
end

puts "Sum: #{sum(5, 3)}"`,

    php: `<?php
echo "Hello, World!\\n";

// Your code here
$sum = 5 + 3;
echo "Sum: $sum\\n";
?>`,

    kotlin: `fun main() {
    println("Hello, World!")
    
    // Your code here
    val sum = 5 + 3
    println("Sum: $sum")
}`,

    swift: `import Foundation

print("Hello, World!")

// Your code here
let sum = 5 + 3
print("Sum: \\(sum)")`
  };

  return templates[language.toLowerCase()] || `// Start coding in ${language}...\n`;
};

/**
 * Get all supported languages
 */
export const getSupportedLanguages = () => {
  return Object.keys(LANGUAGE_CONFIGS).map(lang => ({
    id: lang,
    name: lang.charAt(0).toUpperCase() + lang.slice(1),
    version: LANGUAGE_CONFIGS[lang].version,
    extension: LANGUAGE_CONFIGS[lang].alias
  }));
};

/**
 * Validate code before submission
 */
export const validateCode = (code, language) => {
  const errors = [];

  if (!code || code.trim().length === 0) {
    errors.push('Code cannot be empty');
  }

  if (code.length > 100000) {
    errors.push('Code is too long. Maximum size is 100KB');
  }

  // Language-specific validation
  if (language === 'java') {
    if (!code.includes('class main')) {
      errors.push('Java code must contain a "main" class (lowercase "m")');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Test API connectivity
 */
export const testConnection = async () => {
  try {
    const response = await axios.get(`${PISTON_API}/runtimes`, { timeout: 5000 });
    return {
      success: true,
      message: 'Connected to Piston API',
      runtimes: response.data.length
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to connect to Piston API'
    };
  }
};

export default {
  executeCode,
  getStarterCode,
  getSupportedLanguages,
  validateCode,
  getFileExtension,
  testConnection
};