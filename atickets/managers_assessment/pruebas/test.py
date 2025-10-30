import matplotlib.pyplot as plt
import numpy as np

# Example skill labels
skills = [
    'Pace', 'Shooting', 'Passing', 'Dribbling', 'Defending',
    'Physical', 'Vision', 'Composure', 'Stamina', 'Positioning'
]


# Example player stats for 4 players
player_stats = [
    [85, 78, 82, 90, 65, 74, 88, 80, 86, 79],
    [70, 88, 75, 60, 90, 85, 80, 77, 92, 81],
    [60, 65, 70, 80, 85, 90, 75, 80, 70, 60],
    [95, 90, 85, 80, 75, 70, 65, 60, 55, 50]
]
colors = ['dodgerblue', 'crimson', 'limegreen', 'orange']
labels = ['Player 1', 'Player 2', 'Player 3', 'Player 4']

# Radar charts must loop back to the first valueW

num_skills = len(skills)
angles = np.linspace(0, 2 * np.pi, num_skills, endpoint=False).tolist()
angles += angles[:1]


# Plot with 400x400 pixel output
fig, ax = plt.subplots(figsize=(2, 2), dpi=100, subplot_kw=dict(polar=True))

for stats, color, label in zip(player_stats, colors, labels):
    stats = stats + stats[:1]
    ax.fill(angles, stats, color=color, alpha=0.3, label=label)
    ax.plot(angles, stats, color=color, linewidth=2)


# Set category labels with small font size
ax.set_xticks(angles[:-1])
ax.set_xticklabels(skills, fontsize=7)

# Set the range for each skill (0-100) with small y-tick labels
ax.set_rlabel_position(0)
ax.set_yticks([20, 40, 60, 80, 100])
ax.set_yticklabels(["20", "40", "60", "80", "100"], fontsize=7)
ax.set_ylim(0, 100)

# Title with smaller font
plt.title("FIFA-style Player Stats (4 Players)", size=10, y=1.08)

# Add legend with smaller font
ax.legend(loc='upper right', bbox_to_anchor=(1.2, 1.1), fontsize=7)

# Save to file
output_path = "/home/xavier/Documents/PAE/Projectes/pae/atickets/managers_assessment/pruebas/results/fifa_radar_chart.png"
plt.savefig(output_path)
print(f"Radar chart saved to {output_path}")
