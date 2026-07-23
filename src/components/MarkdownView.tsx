"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownView({ body }: { body: string }) {
  return (
    <div className="prose-sm max-w-none text-sm leading-relaxed text-gray-800 [&_a]:text-indigo-600 [&_a]:underline [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_h1]:mt-4 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_li]:ml-4 [&_ol]:list-decimal [&_p]:mb-3 [&_ul]:list-disc">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
    </div>
  );
}
