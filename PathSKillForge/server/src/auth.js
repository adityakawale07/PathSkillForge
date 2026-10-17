import jwt from "jsonwebtoken";
export const sign = (u) => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
export function protect(req, res, next) {
  const t = (req.headers.authorization || "").replace("Bearer ", "");
  try { req.user = jwt.verify(t, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ message: "Please log in" }); }
}
export const admin = (req, res, next) => req.user.role === "admin" ? next() : res.status(403).json({ message: "Admins only" });
