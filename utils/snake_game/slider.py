import pygame
from config import *

class SpeedSlider:
    def __init__(self):
        self.value = SPEED_DEFAULT
        self.rect = pygame.Rect(WINDOW_WIDTH//2 - 150, WINDOW_HEIGHT - 60, 300, 20)
        self.handle_rect = pygame.Rect(0, 0, 20, 30)
        self.update_handle()
        self.dragging = False

    def update_handle(self):
        x = self.rect.x + int((self.value - SPEED_MIN) / (SPEED_MAX - SPEED_MIN) * self.rect.width)
        self.handle_rect.x = x - self.handle_rect.width//2
        self.handle_rect.y = self.rect.y - 5

    def handle_event(self, event):
        if event.type == pygame.MOUSEBUTTONDOWN:
            if self.handle_rect.collidepoint(event.pos):
                self.dragging = True
        elif event.type == pygame.MOUSEBUTTONUP:
            self.dragging = False
        elif event.type == pygame.MOUSEMOTION and self.dragging:
            rel_x = event.pos[0] - self.rect.x
            rel_x = max(0, min(self.rect.width, rel_x))
            self.value = int(SPEED_MIN + (rel_x / self.rect.width) * (SPEED_MAX - SPEED_MIN))
            self.update_handle()

    def draw(self, screen, font):
        pygame.draw.rect(screen, (200, 200, 200), self.rect)
        pygame.draw.rect(screen, (100, 100, 255), self.handle_rect)
        label = font.render(f"Speed: {self.value}", True, TEXT_COLOR)
        screen.blit(label, (self.rect.x, self.rect.y - 30))
