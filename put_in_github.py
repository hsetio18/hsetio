def test():
  import ipywidgets as widgets
  from IPython.display import display, clear_output
  from os import waitid_result
  import pandas as pd
  import numpy as np
  from google.colab import files
  import time  # Import time for small rendering delays
  import matplotlib.pyplot as plt
  #!pip install statsmodels
  import statsmodels.formula.api as smf
  import re
  import seaborn as sns
  # Create tabs. otput1 and output2
  tab_contents = ['Read me','Dataframe', 'Descriptive Stats', 'Regression']
  children = [widgets.Output() for _ in range(len(tab_contents))]
  tab = widgets.Tab()
  tab.children = children
  for i in range(len(children)):
      tab.set_title(i, str(tab_contents[i]))
  display(tab)
  output1 = widgets.Output()
  display(output1)
  output2 = widgets.Output()
  display(output2)
  df = None
# Define URLs dataset in github
  url_map = {
      'Table 14-1': 'https://raw.githubusercontent.com/hsetio18/hsetio/refs/heads/main/table_14_1.csv',
      'categorical data': 'https://raw.githubusercontent.com/hsetio18/hsetio/refs/heads/main/categorical_example.csv',
      'Antique clock auction': 'https://raw.githubusercontent.com/hsetio18/hsetio/refs/heads/main/antique-clock-auction.csv',
      'Bank of New England': 'https://raw.githubusercontent.com/hsetio18/hsetio/refs/heads/main/BankOfNewEngland_ed17.csv',
      'Condo price': 'https://raw.githubusercontent.com/hsetio18/hsetio/refs/heads/main/condo.csv',
  }
###############

  with children[0]:
    print("Py Commader v1")
    print('Author: Hongyanto Setio')
  with children[1]:
      local_button = widgets.Button(description="Read Local CSV")
      external_button = widgets.Button(description="Read External CSV")
      url_dropdown = widgets.Dropdown(
        options=['Select One']+list(url_map.keys()),
        description='Select url:',
      )
      button_container = widgets.VBox([local_button, external_button, url_dropdown], layout=widgets.Layout(margin='0 0 0 15ch'))
      display(button_container)
