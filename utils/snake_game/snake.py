import pygame
from config import *

class Snake:
    def __init__(self):
        self.body = [(10, 10), (9, 10), (8, 10)]
        self.direction = (1, 0)
        self.grow_pending = 0

    def handle_key(self, key):
        if key == pygame.K_UP and self.direction != (0, 1):
            self.direction = (0, -1)
        elif key == pygame.K_DOWN and self.direction != (0, -1):
            self.direction = (0, 1)
        elif key == pygame.K_LEFT and self.direction != (1, 0):
            self.direction = (-1, 0)
        elif key == pygame.K_RIGHT and self.direction != (-1, 0):
            self.direction = (1, 0)

    def move(self):
        head = (self.body[0][0] + self.direction[0], self.body[0][1] + self.direction[1])
        self.body.insert(0, head)
        if self.grow_pending > 0:
            self.grow_pending -= 1
        else:
            self.body.pop()

    def eat(self, food):
        if self.body[0] == food.position:
            self.grow_pending += 1
            return True
        return False

    def eat_special(self, special_food_pos):
        if self.body[0] == special_food_pos:
            self.grow_pending += 1
            return True
        return False

    def check_collision(self):
        head = self.body[0]
        # Wall collision
        if not (0 <= head[0] < WINDOW_WIDTH // GRID_SIZE and 0 <= head[1] < WINDOW_HEIGHT // GRID_SIZE):
            return True
        # Self collision
        if head in self.body[1:]:
            return True
        return False

    def draw(self, screen):
        for i, segment in enumerate(self.body):
            color = SNAKE_RED if i % 2 == 0 else SNAKE_YELLOW
            rect = pygame.Rect(segment[0]*GRID_SIZE, segment[1]*GRID_SIZE, GRID_SIZE, GRID_SIZE)
            pygame.draw.rect(screen, color, rect)
