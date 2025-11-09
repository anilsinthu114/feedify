export function generateRandomPassword(username: string, email: string): string {
  const specials = "!@#$%^&*()_+[]{}";
  username = (username || "").trim();

  const words = username.split(/\s+/).filter(Boolean); // remove extra spaces
  let base = "";

  if (words.length >= 2) {
    const first = words[0];
    const second = words[1];

    base =
      first.charAt(0).toUpperCase() +
      first.slice(1) +
      second.charAt(0).toUpperCase() +
      second.slice(1, 5);
  } else if (words.length === 1) {
    const first = words[0];
    base = first.charAt(0).toUpperCase() + first.slice(1, 7);
  } else {
    base = "User";
  }

  const emailDigits = (email.match(/\d+/g) || [])[0] || "";
  const randomNum =
    emailDigits.length >= 3
      ? emailDigits.slice(0, 3)
      : Math.floor(100 + Math.random() * 900).toString();

  const specialChar = specials[Math.floor(Math.random() * specials.length)];

  const patternType = Math.floor(Math.random() * 3);
  let password = "";

  switch (patternType) {
    case 0:
      password = `${base}${specialChar}${randomNum}`;
      break;
    case 1:
      password = `${base}${randomNum}${specialChar}`;
      break;
    default:
      password = `${base.slice(0, 5)}${specialChar}${randomNum}`;
      break;
  }

  return password;
}
