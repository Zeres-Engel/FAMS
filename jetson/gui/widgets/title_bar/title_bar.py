layout.setSpacing(0)

# LOAD TITLE
self.title_label = QLabel()
self.title_label.setAlignment(Qt.AlignVCenter)
self.title_label.setStyleSheet('font: 700 9pt "Segoe UI"')

# Icon
self.icon_label = QLabel()
self.icon_label.setAlignment(Qt.AlignVCenter)
self.icon = QPixmap(Functions.set_svg_image("logo_top_80x22.svg"))
self.icon_label.setPixmap(self.icon) 