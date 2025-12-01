import pygame
from config import *
from snake import Snake
from food import Food
from background import Background

class Game:
    def __init__(self, screen, clock):
        self.screen = screen
        self.clock = clock
        if EXCALIDRAX_FONT_PATH:
            self.font = pygame.font.Font(EXCALIDRAX_FONT_PATH, 32)
        else:
            self.font = pygame.font.SysFont('freesansbold', 32)
        self.slider = None
        self.reset()

    def reset(self):
        self.snake = Snake()
        self.food = Food()
        self.special_food = self.spawn_special_food()
        self.background = Background()
        self.score = 0
        self.paused = False
        self.game_over = False
        self.flash_timer = 0
        if not self.slider:
            from slider import SpeedSlider
            self.slider = SpeedSlider()

    def run(self):
        while True:
            self.handle_events()
            if not self.paused and not self.game_over:
                self.update()
            self.render()
            self.clock.tick(self.slider.value)

    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                exit()
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE:
                    self.paused = not self.paused
                elif event.key == pygame.K_r and self.game_over:
                    self.reset()
                else:
                    self.snake.handle_key(event.key)
            self.slider.handle_event(event)

    def update(self):
        self.background.update()
        self.snake.move()
        if self.snake.check_collision():
            self.crash_effect()
            self.game_over = True
        if self.snake.eat(self.food):
            self.score += 1
            self.food.respawn(self.snake.body)
        if self.snake.eat_special(self.special_food):
            self.score += SPECIAL_FOOD_SCORE
            self.special_food = self.spawn_special_food()
    def spawn_special_food(self):
        import random
        while True:
            pos = (random.randint(0, WINDOW_WIDTH // GRID_SIZE - 1), random.randint(0, WINDOW_HEIGHT // GRID_SIZE - 1))
            if pos not in self.snake.body and pos != self.food.position:
                return pos

    def crash_effect(self):
        self.flash_timer = 10
        # Placeholder for sound effect
        # pygame.mixer.Sound('assets/crash.wav').play()

    def render(self):
        if self.flash_timer > 0:
            self.screen.fill(GAME_OVER_FLASH)
            self.flash_timer -= 1
        else:
            self.background.draw(self.screen)
        self.snake.draw(self.screen)
        self.food.draw(self.screen)
        self.draw_special_food()
        self.draw_score()
        self.slider.draw(self.screen, self.font)
        if self.paused:
            self.draw_text("PAUSED", self.font, WINDOW_WIDTH//2, WINDOW_HEIGHT//2)
        if self.game_over:
            self.draw_game_over()
        pygame.display.flip()
    def draw_special_food(self):
        x = self.special_food[0]*GRID_SIZE
        y = self.special_food[1]*GRID_SIZE
        # Draw rectangle (shaft)
        shaft_rect = pygame.Rect(x + GRID_SIZE//4, y, GRID_SIZE//2, GRID_SIZE)
        pygame.draw.rect(self.screen, SPECIAL_FOOD_COLOR, shaft_rect)
        # Draw three circles (balls and tip)
        ball_radius = GRID_SIZE//4
        # Left ball
        pygame.draw.circle(self.screen, SPECIAL_FOOD_COLOR, (x + ball_radius, y + GRID_SIZE - ball_radius), ball_radius)
        # Right ball
        pygame.draw.circle(self.screen, SPECIAL_FOOD_COLOR, (x + GRID_SIZE - ball_radius, y + GRID_SIZE - ball_radius), ball_radius)
        # Tip
        pygame.draw.circle(self.screen, SPECIAL_FOOD_COLOR, (x + GRID_SIZE//2, y + ball_radius), ball_radius)

    def draw_score(self):
        score_text = self.font.render(f"Score: {self.score}", True, TEXT_COLOR)
        self.screen.blit(score_text, (10, 10))

    def draw_text(self, text, font, x, y):
        surf = font.render(text, True, GAME_OVER_FLASH)
        rect = surf.get_rect(center=(x, y))
        self.screen.blit(surf, rect)

    def draw_game_over(self):
        self.draw_text("GAME OVER", self.font, WINDOW_WIDTH//2, WINDOW_HEIGHT//2 - 40)
        self.draw_text("Press R to Restart", self.font, WINDOW_WIDTH//2, WINDOW_HEIGHT//2 + 40)
