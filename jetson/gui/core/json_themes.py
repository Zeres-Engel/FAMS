import json
import os
from gui.core.json_settings import Settings
class Themes(object):
    setup_settings = Settings()
    _settings = setup_settings.items
    def __init__(self):
        super(Themes, self).__init__()
        '#1976d2, #ffffff'
        self.items = {'theme_name': 'Blue', 'app_color': 
            {'dark_one': '#0d47a1', 'dark_two': '#1565c0', 'dark_three': '#1976d2', 
             'dark_four': '#1e88e5', 'bg_one': '#ffffff', 'bg_two': '#ffffff', 'bg_three': '#ffffff', 
             'icon_color': '#555555', 'icon_hover': '#333333', 'icon_pressed': '#1565c0', 
             'icon_active': '#1565c0', 'context_color': '#0d47a1', 'context_hover': '#2196f3', 
             'context_pressed': '#0d47a1', 'text_title': '#ffffff', 'text_foreground': '#555555', 
             'text_description': '#777777', 'text_active': '#1976d2', 'white': '#ffffff', 
             'pink': '#e91e63', 'green': '#4caf50', 'red': '#f44336', 'yellow': '#ffeb3b'}}  