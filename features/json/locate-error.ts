/**
 * Engine-independent JSON error locator. JSON.parse error messages differ
 * between browsers (and recent V8 omits the position), so on failure we rescan
 * the text with a small RFC 8259 validator to find the first error offset.
 */
export interface LocatedError {
  offset: number;
  message: string;
}

export function locateJsonError(text: string): LocatedError | null {
  let i = 0;
  const n = text.length;
  const MAX_DEPTH = 10_000;

  const fail = (message: string, at = i): never => {
    throw { offset: at, message } satisfies LocatedError;
  };
  const ws = () => {
    while (i < n) {
      const c = text.charCodeAt(i);
      if (c === 32 || c === 9 || c === 10 || c === 13) i++;
      else break;
    }
  };
  const describe = (at: number) => (at >= n ? "end of input" : `"${text[at]}"`);

  const str = () => {
    i++; // opening quote
    while (i < n) {
      const c = text.charCodeAt(i);
      if (c === 34) {
        i++;
        return;
      }
      if (c === 92) {
        const e = text[i + 1];
        if (e === "u") {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(i + 2, i + 6))) fail("Invalid \\u escape: expected 4 hex digits", i);
          i += 6;
        } else if (e !== undefined && '"\\/bfnrt'.includes(e)) i += 2;
        else fail(`Invalid escape sequence "\\${e ?? ""}"`, i);
        continue;
      }
      if (c < 0x20) fail(c === 10 ? "Unterminated string (line break inside string)" : "Control character inside string must be escaped");
      i++;
    }
    fail("Unterminated string", n);
  };

  const num = () => {
    const m = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i, i + 400));
    if (!m || m[0] === "-" || m[0] === "") fail(`Invalid number`);
    i += m![0].length;
  };

  const value = (depth: number): void => {
    if (depth > MAX_DEPTH) fail("Nesting is too deep");
    ws();
    if (i >= n) fail("Unexpected end of input: expected a value");
    const c = text[i];
    if (c === "{") {
      i++;
      ws();
      if (text[i] === "}") {
        i++;
        return;
      }
      for (;;) {
        ws();
        if (text[i] !== '"')
          fail(text[i] === "}" ? "Trailing comma before }" : `Expected a double-quoted property name but found ${describe(i)}`);
        str();
        ws();
        if (text[i] !== ":") fail(`Expected ":" after property name but found ${describe(i)}`);
        i++;
        value(depth + 1);
        ws();
        if (text[i] === ",") {
          i++;
          continue;
        }
        if (text[i] === "}") {
          i++;
          return;
        }
        fail(`Expected "," or "}" but found ${describe(i)}`);
      }
    }
    if (c === "[") {
      i++;
      ws();
      if (text[i] === "]") {
        i++;
        return;
      }
      for (;;) {
        ws();
        if (text[i] === "]") fail("Trailing comma before ]");
        value(depth + 1);
        ws();
        if (text[i] === ",") {
          i++;
          continue;
        }
        if (text[i] === "]") {
          i++;
          return;
        }
        fail(`Expected "," or "]" but found ${describe(i)}`);
      }
    }
    if (c === '"') return str();
    if (c === "-" || (c >= "0" && c <= "9")) return num();
    for (const lit of ["true", "false", "null"]) {
      if (text.startsWith(lit, i)) {
        i += lit.length;
        return;
      }
    }
    if (c === "'") fail("Strings must use double quotes, not single quotes");
    fail(`Unexpected ${describe(i)}: expected a value`);
  };

  try {
    value(0);
    ws();
    if (i < n) fail(`Unexpected ${describe(i)} after the end of the JSON value`);
    return null;
  } catch (e) {
    if (e && typeof e === "object" && "offset" in e) return e as LocatedError;
    throw e;
  }
}
