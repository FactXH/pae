import pygame
from config import *
import random

class Bird:
    def __init__(self):
        self.x = random.randint(-100, WINDOW_WIDTH)
        self.y = random.randint(30, WINDOW_HEIGHT//2)
        self.speed = random.uniform(1.5, 3.5)
        self.size = random.randint(10, 20)

    def update(self):
        self.x += self.speed
        if self.x > WINDOW_WIDTH + 50:
            self.x = -50
            self.y = random.randint(30, WINDOW_HEIGHT//2)
            self.speed = random.uniform(1.5, 3.5)
            self.size = random.randint(10, 20)

    def draw(self, screen):
        # Simple bird: two wings and a body (shaded)
        pygame.draw.ellipse(screen, BIRD_COLOR, (self.x, self.y, self.size, self.size//2))
        pygame.draw.line(screen, BIRD_COLOR, (self.x, self.y), (self.x+self.size, self.y), 2)

class Cloud:
    def __init__(self):
        self.x = random.randint(-200, WINDOW_WIDTH)
        self.y = random.randint(10, WINDOW_HEIGHT//2)
        self.speed = random.uniform(0.5, 1.2)
        self.size = random.randint(40, 80)

    def update(self):
        self.x += self.speed
        if self.x > WINDOW_WIDTH + 100:
            self.x = -100
            self.y = random.randint(10, WINDOW_HEIGHT//2)
            self.size = random.randint(40, 80)

    def draw(self, screen):
        pygame.draw.ellipse(screen, CLOUD_COLOR, (self.x, self.y, self.size, self.size//2))
        pygame.draw.ellipse(screen, CLOUD_COLOR, (self.x+20, self.y-10, self.size//2, self.size//3))

class Background:
    def __init__(self):
        self.birds = [Bird() for _ in range(4)]
        self.clouds = [Cloud() for _ in range(3)]

    def update(self):
        for bird in self.birds:
            bird.update()
        for cloud in self.clouds:
            cloud.update()

    def draw(self, screen):
        screen.fill(SKY_COLOR)
        for cloud in self.clouds:
            cloud.draw(screen)
        for bird in self.birds:
            bird.draw(screen)
