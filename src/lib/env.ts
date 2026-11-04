import "server-only";

type ConnectionVariable = "DATABASE_URL" | "CLOUDINARY_URL";

export function getConnectionUrl(name: ConnectionVariable): URL {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing ${name}. Add it to the project .env file.`);
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    // Never include the supplied value: it contains credentials.
    throw new Error(`Invalid ${name} URL.`);
  }

  const protocols =
    name === "DATABASE_URL" ? ["postgres:", "postgresql:"] : ["cloudinary:"];

  if (
    !protocols.includes(url.protocol) ||
    !url.hostname ||
    !url.username ||
    !url.password
  ) {
    throw new Error(
      `Invalid ${name}: expected a connection URL with credentials.`,
    );
  }

  return url;
}
