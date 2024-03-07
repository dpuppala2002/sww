// app.js
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const Recipe = require('./models/recipe');

const app = express();
const port = 3000;

app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/recipePlatform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Class Functionality
class UserController {
  static async register(req, res) {
    try {
      const { username, email, password } = req.body;
      const user = new User({ username, email, password });
      await user.save();
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async login(req, res) {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ username: user.username, email: user.email }, 'your-secret-key');
      res.json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getProfile(req, res) {
    try {
      // Assuming the user information is attached to the request object after authentication
      const user = req.user;
      res.json({ username: user.username, email: user.email });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

// Recipe Class Functionality
class RecipeController {
  static async getAllRecipes(req, res) {
    try {
      const recipes = await Recipe.find();
      res.json(recipes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getRecipeById(req, res) {
    try {
      const { id } = req.params;
      const recipe = await Recipe.findById(id);
      
      if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
      }

      res.json(recipe);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async createRecipe(req, res) {
    try {
      const { title, description, ingredients, instructions } = req.body;
      const recipe = new Recipe({ title, description, ingredients, instructions });
      await recipe.save();
      res.status(201).json({ message: 'Recipe created successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async updateRecipe(req, res) {
    try {
      const { id } = req.params;
      const { title, description, ingredients, instructions } = req.body;
      const recipe = await Recipe.findByIdAndUpdate(id, { title, description, ingredients, instructions }, { new: true });
      
      if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
      }

      res.json({ message: 'Recipe updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async deleteRecipe(req, res) {
    try {
      const { id } = req.params;
      const recipe = await Recipe.findByIdAndDelete(id);
      
      if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
      }

      res.json({ message: 'Recipe deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

// Middleware for JWT authentication
function authenticateToken(req, res, next) {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  });
}

// Routes
app.post('/register', UserController.register);
app.post('/login', UserController.login);
app.get('/profile', authenticateToken, UserController.getProfile);
app.get('/recipes', RecipeController.getAllRecipes);
app.get('/recipes/:id', RecipeController.getRecipeById);
app.post('/recipes', authenticateToken, RecipeController.createRecipe);
app.put('/recipes/:id', authenticateToken, RecipeController.updateRecipe);
app.delete('/recipes/:id', authenticateToken, RecipeController.deleteRecipe);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
