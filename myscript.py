import ipywidgets as widgets
from IPython.display import display, clear_output
import pandas as pd
from google.colab import files

df = None
url = 'https://raw.githubusercontent.com/hsetio18/hsetio/refs/heads/main/antique-clock-auction.csv'

def f_read_local_csv(b):
    with output1:
        clear_output()
        uploaded = files.upload()
        global df
        for fn in uploaded.keys():
            df = pd.read_csv(fn)
        print(df)

def f_read_external_csv(b):
    with output1:
        clear_output()
        global df
        df = pd.read_csv(url)
        print(df)

def f_desc_stats(b):
    with output1:
        clear_output()
        if df is not None:
            print(df.describe())
        else:
            print("No dataframe loaded yet.")

def f_export_df(b):
    with output1:
        if df is not None:
            globals()['df'] = df
            print("✅ df exported to global scope. You can now use it in another cell.")
        else:
            print("⚠️ No dataframe to export. Please load it first.")

tab_contents = ['Dataframe', 'Descriptive Stats']
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

# --- Tab 0: DataFrame Load ---
with children[0]:
    print("Input dataframe from local csv")
    local_button = widgets.Button(description="Read Local CSV")
    external_button = widgets.Button(description="Read External CSV")
    local_button.on_click(f_read_local_csv)
    external_button.on_click(f_read_external_csv)
    button_container = widgets.VBox([local_button, external_button])
    display(button_container)

# --- Tab 1: Descriptive Stats + Export Button ---
with children[1]:
    print("Descriptive Stats")
    df_desc_button = widgets.Button(description="Descriptive Stats")
    export_button = widgets.Button(description="Export df to global")
    df_desc_button.on_click(f_desc_stats)
    export_button.on_click(f_export_df)
    display(widgets.VBox([df_desc_button, export_button]))
