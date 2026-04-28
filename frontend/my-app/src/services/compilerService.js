import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5005";

export const executeCode = async (source_code, language, input = "") => {
  const payload = {
    code: source_code,
    language: language.toLowerCase(),
    input: input,
  };

  console.log("🚀 Compiler Request:", payload);
  console.log("📡 Backend URL:", BACKEND_URL);

  try {
    const response = await axios.post(`${BACKEND_URL}/api/compiler/run`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
      timeout: 20000
    });

    console.log("✅ Compiler Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Compiler Error:", error);

    // Better error handling
    let errorMessage = "Unknown execution error";

    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.code === "ECONNREFUSED") {
      errorMessage = "Backend is not running. Start your server on port 5005.";
    }

    console.error("Error details:", errorMessage);

    return {
      success: false,
      output: "",
      error: errorMessage,
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