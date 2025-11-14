# Health Wrapped

Transform your Apple Health data into beautiful, shareable stories — just like Spotify Wrapped.

## 🚀 How It Works

1. **Export** your Apple Health data from the Health app on your iPhone
2. **Upload** the export.zip file to Health Wrapped
3. **Watch** as your data is parsed and analyzed (all in your browser)
4. **Explore** your year through beautiful, swipeable story cards
5. **Share** your favorite insights with friends!

## 📱 Exporting from Apple Health

1. Open the **Health** app on your iPhone
2. Tap your **profile picture** in the top right
3. Scroll down and tap **"Export All Health Data"**
4. Save the **export.zip** file
5. Upload it to Health Wrapped

## 🚀 Local Development
Backend
```bash
cd server

# Install dependencies
pyenv shell 3.10.8
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Start development server
uvicorn main:app --reload --port 8000
```

Frontend
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```
