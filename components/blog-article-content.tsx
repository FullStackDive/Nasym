"use client";

import { Fragment } from "react";

type BlogArticleContentProps = {
  body: string;
};

function splitBlocks(body: string) {
  return body.replace(/\r\n/g, "\n").split("\n");
}

export default function BlogArticleContent({ body }: BlogArticleContentProps) {
  const lines = splitBlocks(body);
  const nodes: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    nodes.push(
      <p key={`p-${nodes.length}`} className="blog-article-paragraph">
        {paragraph.join(" ")}
      </p>
    );
    paragraph = [];
  };

  const flushBullets = () => {
    if (!bullets.length) return;
    nodes.push(
      <ul key={`ul-${nodes.length}`} className="blog-article-list">
        {bullets.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    );
    bullets = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushBullets();
      return;
    }

    if (line === "---") {
      flushParagraph();
      flushBullets();
      nodes.push(<hr key={`hr-${nodes.length}`} className="blog-article-divider" />);
      return;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushBullets();
      nodes.push(
        <h3 key={`h3-${nodes.length}`} className="blog-article-h3">
          {line.slice(4)}
        </h3>
      );
      return;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushBullets();
      nodes.push(
        <h2 key={`h2-${nodes.length}`} className="blog-article-h2">
          {line.slice(3)}
        </h2>
      );
      return;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      flushBullets();
      nodes.push(
        <blockquote key={`quote-${nodes.length}`} className="blog-article-quote">
          {line.slice(2)}
        </blockquote>
      );
      return;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      bullets.push(line.slice(2));
      return;
    }

    flushBullets();
    paragraph.push(line);
  });

  flushParagraph();
  flushBullets();

  return <div className="blog-article-content">{nodes.map((node, index) => <Fragment key={index}>{node}</Fragment>)}</div>;
}
