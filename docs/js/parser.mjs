export class ParseError extends Error {
  constructor(message, position = null) {
    super(message);
    this.name = "ParseError";
    this.position = position;
  }
}

class Parser {
  constructor(source) {
    this.source = source;
    this.position = 0;
  }

  parse() {
    this.skipWhitespace();
    const value = this.parseValue();
    this.skipWhitespace();
    if (!this.atEnd()) this.fail();
    return value;
  }

  parseValue() {
    this.skipWhitespace();
    return this.peek() === "[" ? this.parseArray() : this.parseNumber();
  }

  parseArray() {
    this.position += 1;
    this.skipWhitespace();
    const items = [];

    if (this.peek() === "]") {
      this.position += 1;
      return { type: "array", items };
    }

    while (true) {
      items.push(this.parseValue());
      this.skipWhitespace();
      if (this.peek() === "]") {
        this.position += 1;
        return { type: "array", items };
      }
      if (this.peek() !== ",") this.fail();
      this.position += 1;
      this.skipWhitespace();
      if (this.peek() === "]" || this.atEnd()) this.fail();
    }
  }

  parseNumber() {
    const rest = this.source.slice(this.position);
    const match = rest.match(/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (!match) this.fail();

    const literal = match[0];
    const value = Number(literal);
    if (!Number.isFinite(value)) this.fail();
    this.position += literal.length;
    return {
      type: "number",
      value,
      isFloat: /[.eE]/.test(literal),
      literal,
    };
  }

  skipWhitespace() {
    while (!this.atEnd() && /\s/.test(this.peek())) this.position += 1;
  }

  peek() {
    return this.source[this.position];
  }

  atEnd() {
    return this.position >= this.source.length;
  }

  fail() {
    throw new ParseError(
      "Couldn't parse that as a number or nested list. Check for missing brackets or commas.",
      this.position,
    );
  }
}

export function parseTensorLiteral(source) {
  if (typeof source !== "string" || source.trim() === "") {
    throw new ParseError(
      "Enter a number or a nested list, e.g. 5 or [[1, 2], [3, 4]].",
    );
  }
  return new Parser(source).parse();
}
