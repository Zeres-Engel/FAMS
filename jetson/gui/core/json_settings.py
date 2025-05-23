import json
import os


class Settings(object):
    def __init__(self):
        super(Settings, self).__init__()
        self.items = {
                    'app_name': 'FAMS',
                    'version': 'v1.0.0',
                    'copyright': 'By: Nguyễn Phước Thành',
                    'year': '2025', 'theme_name': 'default', 
                    'custom_title_bar': True, 
                    'startup_size': [1400, 720], 
                    'minimum_size': [960, 540], 
                    'lef_menu_size': {
                    'minimum': 50, 
                    'maximum': 240}, 
                    'left_menu_content_margins': 3, 
                    'left_column_size': {
                        'minimum': 0, 
                        'maximum': 240}, 
                    'right_column_size': {
                        'minimum': 0, 
                        'maximum': 240}, 
                    'time_animation': 500, 
                    'font': {'family': 'Segoe UI', 
                             'title_size': 10, 
                             'text_size': 10}}
