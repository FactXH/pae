import pygame
from game import Game
from config import WINDOW_WIDTH, WINDOW_HEIGHT, FPS

if __name__ == "__main__":
    pygame.init()
    screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
    pygame.display.set_caption("Catalan Snake - Winter Edition")
    clock = pygame.time.Clock()
    game = Game(screen, clock)
    game.run()
    pygame.quit()
