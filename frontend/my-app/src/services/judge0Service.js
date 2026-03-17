import axios from "axios";

const JUDGE0_API = "https://ce.judge0.com/submissions?base64_encoded=false&wait=true";

export const LANGUAGE_MAPPING = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  typescript: 74,
  csharp: 51,
  go: 60,
  rust: 73,
  ruby: 72,
  php: 68,
};

export const executeCode = async (source_code, language, stdin = "") => {
  try {
    const languageId = LANGUAGE_MAPPING[language.toLowerCase()];

    if (!languageId) {
      throw new Error(`Language "${language}" is not supported by Judge0.`);
    }

    const response = await axios.post(JUDGE0_API, {
      source_code,
      language_id: languageId,
      stdin,
    });

    const { stdout, stderr, compile_output, message, status } = response.data;

    if (status.id > 4) {
      return {
        success: false,
        output: stdout || "",
        error: stderr || compile_output || message || status.description,
        status: status.description,
      };
    }

    return {
      success: true,
      output: stdout || "",
      error: stderr || "",
      status: status.description,
    };
  } catch (error) {
    return {
      success: false,
      output: "",
      error: error.response?.data?.message || error.message || "Unknown execution error",
      status: "Error",
    };
  }
};

export const getStarterCode = (language) => {
  const templates = {
    javascript: `console.log("Hello World");`,
    python: `print("Hello World")`,
    java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}`,
    c: `#include <stdio.h>
int main() {
    printf("Hello World");
    return 0;
}`,
    cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello World";
    return 0;
}`,
    typescript: `console.log("Hello World");`,
    csharp: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello World");
    }
}`,
    go: `package main

import "fmt"

func main() {
    fmt.Println("Hello World")
}`,
    rust: `fn main() {
    println!("Hello World");
}`,
    ruby: `puts "Hello World"`,
    php: `<?php
echo "Hello World";
?>`,
  };

  return templates[language.toLowerCase()] || "";
};
