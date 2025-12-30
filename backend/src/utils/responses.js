export const ok = (res, data, message) => res.status(200).json({ success: true, message, data });
export const created = (res, data, message) => res.status(201).json({ success: true, message, data });
export const badRequest = (res, message) => res.status(400).json({ success: false, message });
export const unauthorized = (res, message) => res.status(401).json({ success: false, message });
export const forbidden = (res, message) => res.status(403).json({ success: false, message });
export const notFound = (res, message) => res.status(404).json({ success: false, message });
export const conflict = (res, message) => res.status(409).json({ success: false, message });
export const serverError = (res, message) => res.status(500).json({ success: false, message });
