export const prettyJson = (value: unknown) => JSON.stringify(value, null, 2);

export async function parseResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}
