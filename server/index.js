const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http").Server(app);
const PORT = 4000;
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const { User } = require("./models");
dotenv.config();

const socketIO = require("socket.io")(http, {
  cors: {
    origin: "http://localhost:3000",
  },
});

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected!"))
  .catch((err) => console.error(err));

const fetchID = () => Math.random().toString(36).substring(1, 9);

let tasks = {
  pending: {
    title: "pending",
    items: [
      {
        id: fetchID(),
        title: "Provide the proposed designs",
        comments: [],
      },
    ],
  },

  ongoing: {
    title: "ongoing",
    items: [
      {
        id: fetchID(),
        title: "Refine and finalise the designs",
        comments: [
          {
            name: "John",
            text: "Verify designs for copyright issues",
            id: fetchID(),
          },
        ],
      },
    ],
  },

  completed: {
    title: "completed",
    items: [
      {
        id: fetchID(),
        title: "Create posters",
        comments: [
          {
            name: "Doe",
            text: "Check the dimensions",
            id: fetchID(),
          },
        ],
      },
    ],
  },
};

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      res.status(400).json({ message: "Username already exists." });
    } else {
      const newUser = new User({ username, password });
      await newUser.save();
      res.status(201).json({
        message: "User registered successfully.",
        user: { id: newUser.id, username: newUser.username },
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Error registering user.", error });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (user) {
    distinct_id = username;
    res.json({
      success: true,
      message: "Login successful",
    });
  } else {
    res
      .status(401)
      .json({ success: false, message: "Invalid username or password" });
  }
});

socketIO.on("connection", (socket) => {
  console.log(`${socket.id} user connected.`);

  socket.on("createTask", (data) => {
   
    const newTask = { id: fetchID(), title: data.task, comments: [] };
    tasks["pending"].items.push(newTask);
    socket.emit("tasks", tasks);
  });

  socket.on("taskDragged", (data) => {
    const { source, destination } = data;

    const itemMoved = {
      ...tasks[source.droppableId].items[source.index],
    };
    tasks[source.droppableId].items.splice(source.index, 1);
    tasks[destination.droppableId].items.splice(
      destination.index,
      0,
      itemMoved
    );
    socket.emit("tasks", tasks);
  });

  socket.on("fetchComments", (data) => {
    const taskItems = tasks[data.category].items;
    for (let i = 0; i < taskItems.length; i++) {
      if (taskItems[i].id === data.id) {
        socket.emit("comments", taskItems[i].comments);
      }
    }
  });
  socket.on("addComment", (data) => {
    const taskItems = tasks[data.category].items;
    for (let i = 0; i < taskItems.length; i++) {
      if (taskItems[i].id === data.id) {
        taskItems[i].comments.push({
          name: data.userId,
          text: data.comment,
          id: fetchID(),
        });
        socket.emit("comments", taskItems[i].comments);
      }
    }
  });

  socket.on("disconnect", () => {
    socket.disconnect();
    console.log("User disconnected");
  });
});

app.get("/home", (req, res) => {
  res.json(tasks);
});

http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
