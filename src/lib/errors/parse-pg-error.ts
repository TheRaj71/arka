export interface AppError {
  code: string;
  message: string;
  detail?: string;
}

/**
 * Parses Postgres / Supabase RPC errors into structured AppError
 */
export function parsePgError(error: unknown): AppError {
  if (!error) {
    return { code: "UNKNOWN", message: "An unexpected error occurred" };
  }

  const errObj = error as Record<string, any>;
  const rawMsg = String(errObj.message || errObj.error_description || error);

  // Match custom "CODE: Human Message" pattern from fn_* RAISE EXCEPTION
  const match = rawMsg.match(/^([A-Z_]{3,40}):\s*(.*)$/);
  if (match && match[1] && match[2]) {
    return {
      code: match[1],
      message: match[2],
    };
  }

  // Postgres SQLSTATE codes
  const code = String(errObj.code || "");
  if (code === "23505") {
    return {
      code: "DUPLICATE",
      message: "A record with this information already exists.",
    };
  }
  if (code === "23514" || code === "23503") {
    return {
      code: "CONSTRAINT_VIOLATION",
      message: "The requested change violates a data constraint or dependency.",
    };
  }
  if (code === "40001") {
    return {
      code: "RETRY",
      message: "Concurrent transaction conflict. Please retry.",
    };
  }
  if (code === "42501") {
    return {
      code: "FORBIDDEN",
      message: "You do not have permission to perform this database operation.",
    };
  }

  return {
    code: "INTERNAL",
    message: rawMsg.length < 150 ? rawMsg : "An error occurred while processing your request.",
  };
}
