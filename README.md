# Daily Routine Tracker

A beautiful, mobile-friendly Progressive Web App (PWA) for tracking daily routines and habits. Built with vanilla JavaScript, HTML5, and CSS3, using IndexedDB for local storage.

## 🌟 Features

- **📱 Mobile-First Design**: Optimized for mobile phones with touch-friendly interface
- **🔄 Progressive Web App**: Can be installed on your phone's home screen
- **💾 Offline Support**: Works without internet connection using local storage
- **📊 Multiple Views**: Today's view, table view, and routine management
- **🎯 Flexible Tracking**: Support for both counter-based and done/not-done routines
- **🎨 Custom Icons**: Add your own emoji icons to routines
- **📈 Progress Tracking**: Visual progress indicators and completion status
- **🔄 Grid/List Toggle**: Switch between grid and list layouts

## 🚀 Live Demo

Visit the live app: [https://yourusername.github.io/routine-tracker](https://yourusername.github.io/routine-tracker)

## 📱 Installation on Phone

1. Open the app in your phone's browser
2. Tap the "Add to Home Screen" option (varies by browser)
3. The app will be installed like a native app
4. Use it offline - all data is stored locally on your device

## 🛠️ Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/routine-tracker.git
   cd routine-tracker
   ```

2. Start a local server:
   ```bash
   python3 -m http.server 8001
   ```

3. Open your browser and go to `http://localhost:8001`

## 📁 Project Structure

```
routine-tracker/
├── index.html          # Main HTML file
├── styles.css          # All styling
├── app.js             # Main application logic
├── manifest.json      # PWA manifest
├── sw.js              # Service worker for offline support
├── icons/             # App icons (placeholder)
└── README.md          # This file
```

## 🎯 How to Use

### Adding Routines
1. Go to "Manage Routines" tab
2. Fill in the routine details:
   - **Name**: What you want to track (e.g., "Water", "Exercise")
   - **Type**: Counter (1, 2, 3...) or Done (✓)
   - **Target**: How many times or if it's a one-time task
   - **Icon**: Optional emoji (e.g., 💧, 🏃‍♂️)
3. Click "Add Routine"

### Tracking Your Day
1. **Today View**: See all your routines for today
   - Tap on counter routines to increment
   - Tap on done routines to mark complete
2. **Table View**: See data for multiple days
   - Navigate between dates
   - Use counters and checkboxes directly in the table

### View Options
- **Grid View**: Card-based layout (default)
- **List View**: Compact list layout
- **Table View**: Spreadsheet-style view for multiple days

## 🔧 Technical Details

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: IndexedDB (browser database)
- **PWA Features**: Service Worker, Web App Manifest
- **Responsive**: CSS Grid and Flexbox
- **Offline**: Works completely offline

## 📱 Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers

## 🚀 Deployment

This app is deployed on GitHub Pages. To deploy your own version:

1. Fork this repository
2. Go to Settings > Pages
3. Select "Deploy from a branch"
4. Choose "main" branch and "/ (root)" folder
5. Your app will be available at `https://yourusername.github.io/routine-tracker`

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Note**: This app stores all data locally on your device. No data is sent to any server, ensuring your privacy and allowing offline use.
