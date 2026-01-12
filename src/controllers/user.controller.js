import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { allowedRoles, defaultPassword } from "../utils/constants.js";

export const addUser = async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    if (!name || !email || !phone || !role) {
      return res
        .status(400)
        .json({ message: "name, email, phone and role are required" });
    }
    if (!allowedRoles.includes(role.toLowerCase())) {
      return res
        .status(400)
        .json({ message: "Invalid role. Allowed values: hr, interviewer" });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ message: "User with this email already exists" });
    }
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const newUser = new User({
      name,
      email,
      phone,
      role: role.toLowerCase(),
      password: hashedPassword,
      createdBy: { id: req.user.id, name: req.user.name },
    });
    await newUser.save();
    // Provide activity payload for middleware
    res.locals.activity = {
      action: "CREATE_USER",
      entityType: "user",
      entityId: newUser._id,
      entityName: newUser.name,
      description: `Created new user: ${newUser.name} (${newUser.email}) with role ${newUser.role}`,
      targetUserId: newUser._id,
    };
    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdBy: newUser.createdBy,
      },
    });
  } catch (err) {
    console.error("ADD USER ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserByRole = async (req, res) => {
  try {
    const { role } = req.query;

    if (!role) {
      return res.status(400).json({
        message: "Role query parameter is required",
      });
    }

    if (!allowedRoles.includes(role.toLowerCase())) {
      return res.status(400).json({
        message: `Invalid role. Allowed values: ${allowedRoles.join(", ")}`,
      });
    }

    const users = await User.find({ role: role.toLowerCase() }).select(
      "name email role"
    );

    return res.status(200).json({
      message: `Users with role '${role}' fetched successfully`,
      count: users.length,
      users,
    });
  } catch (err) {
    console.error("GET USERS BY ROLE ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-__v -password -refreshToken");
    const formattedUsers = users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      createdBy: user.createdBy,
      updatedBy: user.updatedBy,
    }));
    return res.status(200).json({
      message: "Users fetched successfully",
      count: formattedUsers.length,
      users: formattedUsers,
    });
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role } = req.body;

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (role && !allowedRoles.includes(role.toLowerCase())) {
      return res.status(400).json({
        message: `Invalid role. Allowed values: ${allowedRoles.join(", ")}`,
      });
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ message: "Email already exists" });
      }
    }

    const changes = [];
    if (name && name !== user.name) {
      changes.push({
        fieldName: "name",
        oldValue: user.name,
        newValue: name,
        description: `Changed name from "${user.name}" to "${name}"`,
      });
      user.name = name;
    }
    if (email && email !== user.email) {
      changes.push({
        fieldName: "email",
        oldValue: user.email,
        newValue: email,
        description: `Changed email from "${user.email}" to "${email}"`,
      });
      user.email = email;
    }
    if (phone && phone !== user.phone) {
      changes.push({
        fieldName: "phone",
        oldValue: user.phone,
        newValue: phone,
        description: `Changed phone from "${user.phone}" to "${phone}"`,
      });
      user.phone = phone;
    }
    if (role && role.toLowerCase() !== user.role) {
      changes.push({
        fieldName: "role",
        oldValue: user.role,
        newValue: role.toLowerCase(),
        description: `Changed role from "${
          user.role
        }" to "${role.toLowerCase()}"`,
      });
      user.role = role.toLowerCase();
    }

    user.updatedBy = { id: req.user.id, name: req.user.name };
    await user.save();

    // Provide activity payload for middleware
    if (changes.length > 0) {
      res.locals.activity = {
        action: "UPDATE_USER",
        entityType: "user",
        entityId: user._id,
        entityName: user.name,
        changes,
        targetUserId: user._id,
      };
    }

    return res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        updatedAt: user.updatedAt,
        updatedBy: user.updatedBy,
      },
    });
  } catch (err) {
    console.error("UPDATE USER ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const userName = user.name;
    await User.findByIdAndDelete(id);

    // Provide activity payload for middleware
    res.locals.activity = {
      action: "DELETE_USER",
      entityType: "user",
      entityId: user._id,
      entityName: userName,
      description: `Deleted user: ${userName} (${user.email})`,
      targetUserId: user._id,
    };
    return res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
