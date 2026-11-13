// Client-side validation returning plain, human-friendly error messages

export function validateName(value) {
  if (!value || !String(value).trim()) {
    return 'Please tell us what to call you.';
  }
  return null;
}

export function validateContact(type, value) {
  if (!value || !String(value).trim()) {
    return type === 'email'
      ? 'Please add your email address, like name@example.com.'
      : 'Please add your number, like 09 12 34 56 78.';
  }
  const clean = String(value).trim();
  if (type === 'email') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      return 'Please enter a valid email address.';
    }
  } else {
    // Basic phone validation (Ethiopian phone or general numeric)
    const digits = clean.replace(/[^0-9]/g, '');
    if (digits.length < 9) {
      return 'Please add a complete phone number, like 09 12 34 56 78.';
    }
  }
  return null;
}

export function validateIdNumber(route, value) {
  // If referral or no ID required
  if (route === 'referral') return null;
  // ID is optional in some contexts ("Add later"), but if entered:
  if (value && String(value).trim().length < 3) {
    return 'Please enter a valid ID number, or choose Skip.';
  }
  return null;
}

