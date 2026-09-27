import sanitizeHtml from "sanitize-html";

const options: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li", "h2", "h3", "h4", "blockquote", "hr", "span"],
  allowedAttributes: {},
  disallowedTagsMode: "discard",
};

export const cleanHtml = (html: string | undefined | null) => sanitizeHtml(html ?? "", options).trim();
export const cleanText = (s: string | undefined | null) => sanitizeHtml(s ?? "", { allowedTags: [], allowedAttributes: {} }).trim();
