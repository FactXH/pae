import pygame
from config import *
import random

class Food:
    def __init__(self):
        self.position = self.random_position([])

    def random_position(self, snake_body):
        while True:
            pos = (random.randint(0, WINDOW_WIDTH // GRID_SIZE - 1), random.randint(0, WINDOW_HEIGHT // GRID_SIZE - 1))
            if pos not in snake_body:
                return pos

    def respawn(self, snake_body):
        self.position = self.random_position(snake_body)

    def draw(self, screen):
        rect = pygame.Rect(self.position[0]*GRID_SIZE, self.position[1]*GRID_SIZE, GRID_SIZE, GRID_SIZE)
        pygame.draw.rect(screen, FOOD_COLOR, rect)
