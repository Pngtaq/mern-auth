import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import transporter from "../config/nodemailer.js";
export const register = async (req, res) => {
  const { name, email, password } = req.body;
  console.log(email);
  console.log(req.body);
  if (!name || !email || !password) {
    return res.json({ success: false, message: "Missing Details" });
  }

  try {
    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new userModel({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const mailOptions = {
      from: `"MERN-Auth Team" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "🎉 Welcome to MERN-Auth!",
      text: `Hi ${name},\n\nWelcome to MERN-Auth! We're excited to have you join our growing community of note-takers and idea catchers.\n\nGet started now and make your memory game strong!\n\nIf you ever need help, we’re just one email away.\n\nCheers,\nThe MERN-Auth Team`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            <h2 style="color: #2d89ef;">Welcome to <span style="color: #1e1e1e;">MERN-Auth</span>, ${name}!</h2>
            <p>We're so glad you've joined us. 🎉</p>
            <p>With MERN-Auth, you can:</p>
            <ul>
              <li>📝 Capture ideas instantly</li>
              <li>🔐 Keep your notes safe and secure</li>
              <li>🌍 Access them anytime, anywhere</li>
            </ul>
            <p>We’re here to help you stay organized and never forget what matters most.</p>
            <a href="https://your-website-url.com" style="display: inline-block; margin-top: 20px; background-color: #2d89ef; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Get Started</a>
            <p style="margin-top: 30px;">If you ever have questions, feel free to reply to this email.</p>
            <p style="color: #888;">– The MERN-Auth Team</p>
          </div>
        </div>
      `,
    };

    console.log(process.env.SMTP_USER, process.env.SMTP_PASSWORD);
    await transporter.sendMail(mailOptions);

    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ sucess: false, message: "Invalid email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ sucess: false, message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });
    return res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
