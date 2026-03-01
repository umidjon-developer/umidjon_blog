"use client";

import parse from "html-react-parser";

export default function ParsedHTML({ html }: { html: string }) {
  return <>{parse(html)}</>;
}
