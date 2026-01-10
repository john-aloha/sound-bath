# Sound Bath Sanctuary

An immersive web-based sound healing experience featuring interactive singing bowls, crystal bowls, and Tibetan bowls. Built with vanilla JavaScript and the Web Audio API.

## Features

- Interactive sound synthesis using Web Audio API
- Multiple instrument types (Singing Bowls, Crystal Bowls, Tibetan Bowls)
- Real-time audio visualizations
- Reverb and delay effects
- Responsive design with beautiful animations

## Running with Docker

### Using Docker Compose (Recommended)

```bash
# Build and start the container
docker-compose up -d

# Access the app at http://localhost:8080
```

### Using Docker directly

```bash
# Build the image
docker build -t sound-bath-sanctuary .

# Run the container
docker run -d -p 8080:80 --name sound-bath sound-bath-sanctuary

# Access the app at http://localhost:8080
```

### Docker Commands

```bash
# Stop the container
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after changes
docker-compose up -d --build
```

## Running Locally (Without Docker)

Simply open `index.html` in a modern web browser, or serve with any static file server:

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js http-server
npx http-server -p 8080
```

## Technology Stack

- HTML5
- CSS3 with animations
- Vanilla JavaScript (ES6+)
- Web Audio API
- Canvas API for visualizations

## Browser Compatibility

Requires a modern browser with Web Audio API support:
- Chrome/Edge 89+
- Firefox 87+
- Safari 14+
