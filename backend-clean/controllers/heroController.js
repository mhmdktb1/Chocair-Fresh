import Hero from '../models/heroModel.js';

// @desc    Fetch all hero slides
// @route   GET /api/hero
// @access  Public
const getHeroes = async (req, res) => {
  try {
    const { page } = req.query;
    const query = page ? { page } : {};
    const heroes = await Hero.find(query).sort({ order: 1 });
    res.json(heroes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a hero slide
// @route   POST /api/hero
// @access  Public (for now)
const createHero = async (req, res) => {
  try {
    const { title, subtitle, backgroundImage, ctaText, ctaLink, isActive, order, page } = req.body;

    const hero = await Hero.create({
      title,
      subtitle,
      backgroundImage,
      ctaText,
      ctaLink,
      isActive,
      order,
      page: page || 'home',
    });

    if (hero) {
      res.status(201).json(hero);
    } else {
      res.status(400).json({ message: 'Invalid hero data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a hero slide
// @route   PUT /api/hero/:id
// @access  Public (for now)
const updateHero = async (req, res) => {
  try {
    const { title, subtitle, backgroundImage, ctaText, ctaLink, isActive, order, page } = req.body;
    const hero = await Hero.findById(req.params.id);

    if (hero) {
      hero.title = title || hero.title;
      hero.subtitle = subtitle || hero.subtitle;
      hero.backgroundImage = backgroundImage || hero.backgroundImage;
      hero.ctaText = ctaText || hero.ctaText;
      hero.ctaLink = ctaLink || hero.ctaLink;
      hero.page = page || hero.page;
      if (isActive !== undefined) hero.isActive = isActive;
      if (order !== undefined) hero.order = order;

      const updatedHero = await hero.save();
      res.json(updatedHero);
    } else {
      res.status(404).json({ message: 'Hero slide not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a hero slide
// @route   DELETE /api/hero/:id
// @access  Public (for now)
const deleteHero = async (req, res) => {
  try {
    const hero = await Hero.findById(req.params.id);

    if (hero) {
      await hero.deleteOne();
      res.json({ message: 'Hero slide removed' });
    } else {
      res.status(404).json({ message: 'Hero slide not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getHeroes, createHero, updateHero, deleteHero };
