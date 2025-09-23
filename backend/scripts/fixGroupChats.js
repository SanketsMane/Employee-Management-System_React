const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Group = require('../models/Group');
const Chat = require('../models/Chat');
const User = require('../models/User');

async function fixGroupChats() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all groups without chat field or with null chat
    const groupsWithoutChats = await Group.find({
      $or: [
        { chat: null },
        { chat: { $exists: false } }
      ]
    }).populate('members.user', 'firstName lastName email profilePicture role');

    console.log(`Found ${groupsWithoutChats.length} groups without chats`);

    for (const group of groupsWithoutChats) {
      console.log(`Processing group: ${group.name}`);
      
      // Check if a chat already exists for this group
      let existingChat = await Chat.findOne({ group: group._id });
      
      if (existingChat) {
        console.log(`  - Found existing chat for group ${group.name}`);
        group.chat = existingChat._id;
        await group.save();
      } else {
        console.log(`  - Creating new chat for group ${group.name}`);
        
        // Create new chat for this group
        const chat = new Chat({
          name: group.name,
          participants: group.members.map(member => member.user._id),
          isGroup: true,
          group: group._id,
          createdBy: group.createdBy,
          chatType: 'group'
        });

        await chat.save();
        
        // Update group with chat reference
        group.chat = chat._id;
        await group.save();
        
        console.log(`  - Created chat ${chat._id} for group ${group.name}`);
      }
    }

    console.log('Finished fixing group chats');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing group chats:', error);
    process.exit(1);
  }
}

fixGroupChats();