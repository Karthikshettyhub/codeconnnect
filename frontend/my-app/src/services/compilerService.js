import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5005";

export const executeCode = async (source_code, language, stdin = "") => {
  try {
     console.log("Sending language:", language); // add this
  console.log("Sending code:", source_code);
    const response = await axios.post(`${BACKEND_URL}/api/compiler/run`, {
        
      code: source_code,
      language,
      stdin,
    });

    const { output, error, executionTime } = response.data;

    if (error) {
      return {
        success: false,
        output: output || "",
        error,
        executionTime,
      };
    }

    return {
      success: true,
      output: output || "Ran successfully — no output",
      error: "",
      executionTime,
    };
  } catch (err) {
    return {
      success: false,
      output: "",
      error: err.response?.data?.error || err.message || "Unknown error",
      executionTime: 0,
    };
  }
};