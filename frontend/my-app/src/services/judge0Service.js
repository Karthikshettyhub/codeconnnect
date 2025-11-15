// src/services/judge0Service.js

import axios from 'axios';

const JUDGE0_API_URL = 'https://judge0-ce.p.rapidapi.com';
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'judge0-ce.p.rapidapi.com';

/**
 * Language ID Mapping for Judge0
 * Full list: https://ce.judge0.com/languages
 */
export const LANGUAGE_IDS = {
  javascript: 63,   // JavaScript (Node.js 12.14.0)
  python: 71,       // Python (3.8.1)
  java: 62,         // Java (OpenJDK 13.0.1)
  cpp: 54,          // C++ (GCC 9.2.0)
  c: 50,            // C (GCC 9.2.0)
  csharp: 51,       // C# (Mono 6.6.0.161)
  ruby: 72,         // Ruby (2.7.0)
  go: 60,           // Go (1.13.5)
  rust: 73,         // Rust (1.40.0)
  php: 68,          // PHP (7.4.1)
  typescript: 74,   // TypeScript (3.7.4)
  kotlin: 78,       // Kotlin (1.3.70)
  swift: 83,        // Swift (5.2.3)
  sql: 82,          // SQL (SQLite 3.27.2)
  r: 80,            // R (4.0.0)
};

export const getLanguageName = (languageId) => {
  const entry = Object.entries(LANGUAGE_IDS).find(([, id]) => id === languageId);
  return entry ? entry[0] : 'unknown';
};

export const getFileExtension = (language) => {
  const extensions = {
    javascript: 'js',
    python: 'py',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    csharp: 'cs',
    ruby: 'rb',
    go: 'go',
    rust: 'rs',
    php: 'php',
    typescript: 'ts',
    kotlin: 'kt',
    swift: 'swift',
    sql: 'sql',
    r: 'r'
  };
  return extensions[language.toLowerCase()] || 'txt';
};

/**
 * Main function to execute code using Judge0
 * 
 * @param {string} code - Source code to execute
 * @param {string} language - Programming language (e.g., 'javascript', 'python')
 * @param {string} stdin - Standard input for the program
 * @param {number} timeLimit - CPU time limit in seconds (default: 2)
 * @param {number} memoryLimit - Memory limit in KB (default: 128000 = 128MB)
 * @returns {Promise<Object>} Execution result
 */

export const executeCode = async (
  code,
  language,
  stdin = '',
  timeLimit = 2,
  memoryLimit = 128000
) => {
  try {
    // Validate API key
    if (!RAPIDAPI_KEY || RAPIDAPI_KEY === 'your_rapidapi_key_here') {
      throw new Error(
        'RapidAPI key not configured. Please add VITE_RAPIDAPI_KEY to your .env file'
      );
    }

    // Get language ID
    const languageId = LANGUAGE_IDS[language.toLowerCase()];
    if (!languageId) {
      throw new Error(
        `Language "${language}" is not supported. Supported languages: ${Object.keys(
          LANGUAGE_IDS
        ).join(', ')}`
      );
    }

    console.log('Submitting code to Judge0...');
    console.log('Language:', language, '(ID:', languageId + ')');
    console.log('Code length:', code.length, 'characters');

    // Step 1: Submit code for execution
    const submissionResponse = await axios.post(
      `${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: code,
        language_id: languageId,
        stdin: stdin || '',
        cpu_time_limit: timeLimit,
        memory_limit: memoryLimit,
        // Additional options
        wall_time_limit: timeLimit * 2, // Wall time = 2x CPU time
        enable_network: false, // Disable network for security
        compile_timeout: 10 // Compile timeout in seconds
      },
      {
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST
        }
      }
    );

    const result = submissionResponse.data;

    console.log('Judge0 response received');
    console.log('Status:', result.status.description);

    // Parse the result
    return parseJudge0Result(result);
  } catch (error) {
    console.error('Judge0 Error:', error);
    return handleJudge0Error(error);
  }
};

/**
 * Parse Judge0 result into a standardized format
 */
const parseJudge0Result = (result) => {
  const statusId = result.status.id;
  const statusDescription = result.status.description;

  // Status IDs:
  // 1-2: In Queue/Processing
  // 3: Accepted (Success)
  // 4: Wrong Answer
  // 5: Time Limit Exceeded
  // 6: Compilation Error
  // 7-14: Runtime Errors

  const isSuccess = statusId === 3; // Accepted
  const hasCompileError = statusId === 6;
  const hasRuntimeError = statusId >= 7 && statusId <= 14;
  const isTimeLimit = statusId === 5;

  // Build output
  let output = '';
  let error = '';

  if (isSuccess) {
    output = result.stdout || '';
  }

  // Handle errors
  if (hasCompileError) {
    error = result.compile_output || 'Compilation failed';
  } else if (hasRuntimeError) {
    error = result.stderr || result.message || statusDescription;
  } else if (isTimeLimit) {
    error = 'Time Limit Exceeded. Your code took too long to execute.';
  } else if (result.stderr) {
    error = result.stderr;
  }

  // Parse execution metrics
  const executionTime = parseFloat(result.time) || 0;
  const memory = parseInt(result.memory) || 0;

  return {
    success: isSuccess,
    output: output.trim(),
    error: error.trim(),
    executionTime: executionTime,
    memory: memory,
    status: statusDescription,
    statusId: statusId,
    // Additional info
    compileOutput: result.compile_output || '',
    exitCode: result.exit_code,
    exitSignal: result.exit_signal
  };
};

/**
 * Handle Judge0 API errors
 */
const handleJudge0Error = (error) => {
  let errorMessage = 'An unexpected error occurred';

  if (error.response) {
    // Server responded with error
    const status = error.response.status;
    const data = error.response.data;

    if (status === 401) {
      errorMessage = 'Invalid API key. Please check your RapidAPI key.';
    } else if (status === 429) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
    } else if (status === 422) {
      errorMessage = data.message || 'Invalid submission data.';
    } else {
      errorMessage = data.message || `Server error: ${status}`;
    }
  } else if (error.request) {
    // Request made but no response
    errorMessage = 'Network error. Please check your internet connection.';
  } else {
    // Error in request setup
    errorMessage = error.message;
  }

  return {
    success: false,
    output: '',
    error: errorMessage,
    executionTime: 0,
    memory: 0,
    status: 'Error',
    statusId: -1
  };
};

/**
 * Get starter code template for a language
 */
export const getStarterCode = (language) => {
  const templates = {
    javascript: `// JavaScript (Node.js)
const greeting = "Hello, World!";
console.log(greeting);

// Try reading input:
// const readline = require('readline');
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });
// rl.question('Enter your name: ', (name) => {
//   console.log(\`Hello, \${name}!\`);
//   rl.close();
// });`,

    python: `# Python 3
greeting = "Hello, World!"
print(greeting)

# Try reading input:
# name = input("Enter your name: ")
# print(f"Hello, {name}!")`,

    java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // Try reading input:
        // Scanner scanner = new Scanner(System.in);
        // System.out.print("Enter your name: ");
        // String name = scanner.nextLine();
        // System.out.println("Hello, " + name + "!");
    }
}`,

    cpp: `#include <iostream>
#include <string>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    
    // Try reading input:
    // string name;
    // cout << "Enter your name: ";
    // getline(cin, name);
    // cout << "Hello, " << name << "!" << endl;
    
    return 0;
}`,

    c: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    
    // Try reading input:
    // char name[100];
    // printf("Enter your name: ");
    // scanf("%s", name);
    // printf("Hello, %s!\\n", name);
    
    return 0;
}`,

    csharp: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
        
        // Try reading input:
        // Console.Write("Enter your name: ");
        // string name = Console.ReadLine();
        // Console.WriteLine($"Hello, {name}!");
    }
}`,

    ruby: `# Ruby
greeting = "Hello, World!"
puts greeting

# Try reading input:
# print "Enter your name: "
# name = gets.chomp
# puts "Hello, #{name}!"`,

    go: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
    
    // Try reading input:
    // var name string
    // fmt.Print("Enter your name: ")
    // fmt.Scanln(&name)
    // fmt.Printf("Hello, %s!\\n", name)
}`,

    rust: `fn main() {
    println!("Hello, World!");
    
    // Try reading input:
    // use std::io;
    // let mut name = String::new();
    // println!("Enter your name: ");
    // io::stdin().read_line(&mut name).expect("Failed to read");
    // println!("Hello, {}!", name.trim());
}`,

    php: `<?php
$greeting = "Hello, World!";
echo $greeting . "\\n";

// Try reading input:
// echo "Enter your name: ";
// $name = trim(fgets(STDIN));
// echo "Hello, $name!\\n";
?>`,

    typescript: `// TypeScript
const greeting: string = "Hello, World!";
console.log(greeting);

// Try reading input:
// import * as readline from 'readline';
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });
// rl.question('Enter your name: ', (name: string) => {
//   console.log(\`Hello, \${name}!\`);
//   rl.close();
// });`
  };

  return templates[language.toLowerCase()] || `// Start coding in ${language}...\n`;
};

/**
 * Get all supported languages
 */
export const getSupportedLanguages = () => {
  return Object.keys(LANGUAGE_IDS).map(lang => ({
    id: lang,
    name: lang.charAt(0).toUpperCase() + lang.slice(1),
    languageId: LANGUAGE_IDS[lang],
    extension: getFileExtension(lang)
  }));
};

/**
 * Validate code before submission
 */
export const validateCode = (code, language) => {
  const errors = [];

  // Check if code is empty
  if (!code || code.trim().length === 0) {
    errors.push('Code cannot be empty');
  }

  // Check code length (Judge0 limit: ~65KB)
  if (code.length > 65000) {
    errors.push('Code is too long. Maximum size is 65KB');
  }

  // Language-specific validation
  if (language === 'java') {
    if (!code.includes('class Main') && !code.includes('public class Main')) {
      errors.push('Java code must contain a "Main" class');
    }
    if (!code.includes('public static void main')) {
      errors.push('Java code must contain a "main" method');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  executeCode,
  getStarterCode,
  getSupportedLanguages,
  validateCode,
  LANGUAGE_IDS
};