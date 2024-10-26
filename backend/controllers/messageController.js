import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import Conversation from "../models/conversationModel.js";

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.params;
    const { message } = req.body;

    if (!senderId) {
      return res.status(404).json({ message: "No user found!" });
    }

    if (!message) {
      return res.status(404).json({ message: "A message should have a text" });
    }

    const user = await User.findById(receiverId);

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      message,
    });

    if (newMessage) {
      conversation.messages.push(newMessage._id);
      await conversation.save();
      await newMessage.save();
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully!",
      data: newMessage,
    });
  } catch (error) {
    console.log("error in sendMessage controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.params;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      return res.status(200).json({ success: true, message: [] });
    }

    res.status(200).json({
      success: true,
      message: "Conversation found successfully!",
      data: conversation?.messages,
    });
  } catch (error) {
    console.log("error in getMessage controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
