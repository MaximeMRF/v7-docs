export const controllers = {
  Docs: () => import('#controllers/docs_controller'),
  Home: () => import('#controllers/home_controller'),
  LlmDocs: () => import('#controllers/llm_docs_controller'),
}
