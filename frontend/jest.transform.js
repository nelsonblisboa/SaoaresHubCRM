// jest.transform.js - Transform para lidar com import.meta.env
// Substitui import.meta.env por um objeto mockado

module.exports = (source, filepath, jestConfig) => {
  // Substituir import.meta.env por IMPORT_META_ENV_MOCK
  const transformedSource = source.replace(
    /import\.meta\.env/g,
    'global.__IMPORT_META_ENV__'
  )

  return {
    code: transformedSource,
    map: null,
  }
}
