import { test, expect } from "@playwright/test";
import { validateEditorSelection } from "../../src/lib/edition/ai-editor";
import type { GroupedSourceArticle } from "../../src/lib/edition/types";

const article: GroupedSourceArticle = {
  id: "library", external_id: "wire-library", title: "City opens a public library",
  description: "Residents can use new study rooms and borrow books at the new city library.",
  snippet: null, url: "https://news.test/library", publisher: "City reporting", image_url: null,
  published_at: "2026-10-19T10:00:00Z", language: "en", categories: ["general"], locale: null,
  supportingArticles: [], whyItMatters: "Residents can use new study rooms and borrow books.",
};
const preferences = { interests: ["general"], preferred_region: "global", reading_length: 5 };

test("editor cannot select the same Story through two identity aliases", () => {
  expect(validateEditorSelection({ selected_stories: [
    { id: "library", section: "main", position: 1 },
    { id: "wire-library", section: "main", position: 2 },
  ] }, [article], preferences).valid).toBe(false);
});

test("editor cannot replace verified importance with invented consequences", () => {
  expect(validateEditorSelection({ selected_stories: [
    { id: "library", section: "main", position: 1, why_it_matters: "A reactor explosion threatens thousands of residents." },
  ] }, [article], preferences).valid).toBe(false);
});

test("editor must assign contiguous positions and put a main Story first", () => {
  expect(validateEditorSelection({ selected_stories: [
    { id: "library", section: "main", position: 3 },
  ] }, [article], preferences).valid).toBe(false);
  expect(validateEditorSelection({ selected_stories: [
    { id: "library", section: "beyond_bubble", position: 1 },
  ] }, [article], preferences).valid).toBe(false);
});

test("editor may retain an existing importance explanation", () => {
  expect(validateEditorSelection({ selected_stories: [
    { id: "library", section: "main", position: 1, why_it_matters: article.whyItMatters },
  ] }, [article], preferences).valid).toBe(true);
});

test("editor cannot spend two slots on the same canonical event under different IDs", () => {
  const alternate = { ...article, id: "library-alternate", external_id: "wire-alternate", url: `${article.url}?utm_source=wire` };
  expect(validateEditorSelection({ selected_stories: [
    { id: article.id, section: "main", position: 1 },
    { id: alternate.id, section: "main", position: 2 },
  ] }, [article, alternate], preferences).valid).toBe(false);
});
