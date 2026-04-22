import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5005";

export const executeCode = async (source_code, language) => {
    console.log("calling backend:", `${BACKEND_URL}/api/compiler/run`);
  console.log("language:", language);
  try {
    const response = await axios.post(`${BACKEND_URL}/api/compiler/run`, {
      code: source_code,
      language: language.toLowerCase(),
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      output: "",
      error: error.response?.data?.error || error.message || "Unknown execution error",
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