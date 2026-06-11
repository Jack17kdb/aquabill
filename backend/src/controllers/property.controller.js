import PropertyUnit from '../models/PropertyUnit.js';

export const createProperty = async (req, res) => {
  try {
    const data = { ...req.body, ownerId: req.adminId };
    data.houseNumber = data.houseNumber.toUpperCase().trim();

    const existing = await PropertyUnit.findOne({ ownerId: req.adminId, houseNumber: data.houseNumber });
    if (existing) {
      return res.status(400).json({ error: `House ${data.houseNumber} already exists` });
    }

    const property = await PropertyUnit.create(data);
    res.status(201).json({ property });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ error: 'Failed to create property' });
  }
};

export const getAllProperties = async (req, res) => {
  try {
    const properties = await PropertyUnit.find({ ownerId: req.adminId }).sort({ houseNumber: 1 });
    res.json({ properties });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
};

export const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates.ownerId; // prevent reassignment

    const property = await PropertyUnit.findOneAndUpdate(
      { _id: id, ownerId: req.adminId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json({ property });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
};

export const markVacant = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVacant } = req.body;

    const update = isVacant
      ? { isVacant: true, tenantName: '', phoneNumber: '' }
      : { isVacant: false };

    const property = await PropertyUnit.findOneAndUpdate(
      { _id: id, ownerId: req.adminId },
      { $set: update },
      { new: true }
    );

    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json({ property });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update vacancy status' });
  }
};

export const getStats = async (req, res) => {
  try {
    const total = await PropertyUnit.countDocuments({ ownerId: req.adminId });
    const vacant = await PropertyUnit.countDocuments({ ownerId: req.adminId, isVacant: true });
    const occupied = total - vacant;

    const Invoice = (await import('../models/Invoice.js')).default;
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const waterBilledResult = await Invoice.aggregate([
      { $match: { ownerId: req.adminId, createdAt: { $gte: currentMonth } } },
      { $group: { _id: null, total: { $sum: '$waterCost' } } }
    ]);

    const totalWaterBilled = waterBilledResult[0]?.total || 0;

    res.json({ total, vacant, occupied, totalWaterBilled });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// ── PUBLIC: Get house info for registration page ──────────────────
export const getPublicHouseInfo = async (req, res) => {
  try {
    const { ownerId } = req.params;
    // Only return safe public info — no readings, no financials
    const user = await (await import('../models/User.js')).default.findOne({
      _id: ownerId,
      role: 'admin',
      isActive: true,
      isDeleted: false
    });
    if (!user) return res.status(404).json({ error: 'Property not found or inactive' });

    res.json({
      houseName: user.houseName || 'Property',
      caretakerName: user.caretakerName || ''
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load property info' });
  }
};

// ── PUBLIC: Tenant self-registration ─────────────────────────────
export const publicRegisterRoom = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { houseNumber, tenantName, phoneNumber } = req.body;

    if (!houseNumber?.trim()) return res.status(400).json({ error: 'House number is required' });
    if (!tenantName?.trim())  return res.status(400).json({ error: 'Tenant name is required' });
    if (!phoneNumber?.trim()) return res.status(400).json({ error: 'WhatsApp number is required' });

    // Verify the owner account exists and is active
    const User = (await import('../models/User.js')).default;
    const owner = await User.findOne({ _id: ownerId, role: 'admin', isActive: true, isDeleted: false });
    if (!owner) return res.status(404).json({ error: 'Property not found or inactive' });

    const houseNum = houseNumber.trim().toUpperCase();

    // Check for duplicate house number under this owner
    const existing = await PropertyUnit.findOne({ ownerId, houseNumber: houseNum });
    if (existing && !existing.isVacant) {
      return res.status(409).json({ error: `Room ${houseNum} is already registered` });
    }

    if (existing && existing.isVacant) {
      // Room exists but vacant — update it with tenant details
      existing.tenantName  = tenantName.trim();
      existing.phoneNumber = phoneNumber.trim();
      existing.isVacant    = false;
      await existing.save();
      return res.status(200).json({ message: 'Room registered successfully', houseNumber: houseNum });
    }

    // Create new room
    await PropertyUnit.create({
      ownerId,
      houseNumber: houseNum,
      tenantName:  tenantName.trim(),
      phoneNumber: phoneNumber.trim(),
      isVacant:    false,
      lastReading: 0,
      currentReading: 0,
      waterMeterPricePerUnit: owner.pricePerRoom || 50
    });

    res.status(201).json({ message: 'Room registered successfully', houseNumber: houseNum });
  } catch (err) {
    console.error('Public register error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'This room number is already taken' });
    }
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};
