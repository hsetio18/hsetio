# Created by Hongyanto Setio
# Last update: 09 April 2025
# Use as-is
# no any claim
def py_commander():
    import ipywidgets as widgets
    from IPython.display import display, clear_output
    import pandas as pd
    import numpy as np
    from google.colab import files
    import time  # Import time for small rendering delays
    import matplotlib.pyplot as plt
    #!pip install statsmodels
    import statsmodels.formula.api as smf
    import re
    import seaborn as sns
    ############
    # df = None
    # Define URLs dataset in github
    url_map = {
        'Table 14-1': 'https://raw.githubusercontent.com/hsetio18/hsetio/refs/heads/main/table_14_1.csv',
        'categorical data': 'https://raw.githubusercontent.com/hsetio18/hsetio/refs/heads/main/categorical_example.csv',
        'Antique clock auction': 'https://raw.githubusercontent.com/hsetio18/hsetio/refs/heads/main/antique-clock-auction.csv',
        'KWH usage base on home size':'https://raw.githubusercontent.com/hsetio18/hsetio/refs/heads/main/kwh_size.csv',
        'Bank of New England': 'https://raw.githubusercontent.com/hsetio18/hsetio/refs/heads/main/BankOfNewEngland_ed17.csv',
        'Condo price': 'https://raw.githubusercontent.com/hsetio18/hsetio/refs/heads/main/condo.csv',
    }
    ###############
    # general custom functions


    def select_one_cat(b):
        if df is None:
            return
        cat_cols = df.select_dtypes(include=['object']).columns
        if len(cat_cols) == 0:
            return
        cat_dropdown = widgets.Select(
                  options=cat_cols,
                  description='Category:',
                  rows=len(cat_cols),
                  disabled=False
                )
        return(cat_dropdown)

    def select_one_num(b):
        if df is None:
            return
        num_cols = df.select_dtypes(include=['number']).columns
        if len(num_cols) == 0:
            return
        num_dropdown = widgets.Select(    #or Dropdown(
            options=num_cols,
            description='Y:',
            rows=len(num_cols),
            disabled=False
          )
        return(num_dropdown)

    def f_read_local_csv(b,output):
        with output:
            clear_output(wait=True)
            print("Alert: If you want to cancel read from local csv, you have to click [Cancel Upload] befor you switch to other menu!")
            try:
                uploaded = files.upload()
                global df
                for fn in uploaded.keys():
                      df = pd.read_csv(fn)
                print("data set from read local csv:")
                print(df.head())
                with output2:
                      clear_output()
            except Exception as e:
                print(f"Error: {e}")
    def f_get_csv_button(b, url,output):
        with output:
            clear_output(wait=True)

            try:
                global df
                df = pd.read_csv(url)
                print("data set from read external csv:")
                print(df.head())
                with output2:
                      clear_output()
            except Exception as e:
                print(f"Error: {e}")

    def f_read_external_csv(b,output):
        with output:
            clear_output(wait=True)
            external_text = widgets.Text(description='URL:', placeholder='Enter URL')
            get_csv_button = widgets.Button(description="Read External CSV")
            # get_csv_button.on_click(lambda b: f_get_csv_button(external_text.value, output))
            get_csv_button.on_click(lambda b: f_get_csv_button(b, external_text.value, output))

            button_container = widgets.VBox([external_text,get_csv_button])
            display(button_container)
    def f_crt_pie(df,category,title):
      counts = df[category].value_counts()
      fig, ax = plt.subplots(figsize=(6, 6))
      ax.pie(counts, labels=counts.index, autopct='%1.1f%%',
            colors=['lightblue', 'lightcoral', 'lightgreen', 'orange'])
      ax.set_title(title)
      return fig
    def f_piechart(b,output):
        def generate_pie_chart(b):
                with output2:
                    clear_output()
                    category = cat_dropdown.value
                    if category is not None:
                        plt.show(f_crt_pie(df,category,chart_title.value))
                    else:
                        print("No category selected")

        with output:
            clear_output(wait=True)
            print("Pie chart")
            cat_dropdown = select_one_cat(b)
            if cat_dropdown is None:
                print("No Dataframe or no category selected")
                return
            chart_title = widgets.Text(
                      value="My Pie Chart",
                      description='Title:',
                      disabled=False
                    )
            btn1 = widgets.Button(description="Generate Chart")
            btn1.on_click(generate_pie_chart)
            # time.sleep(0.1)  # Short delay to ensure rendering
            gwidget=widgets.VBox([cat_dropdown, chart_title, btn1])
            display(gwidget)

    def f_histogram(b,output):
        def f_crt_histogram(b):
              with output2:
                clear_output()
                plt.figure(figsize=(8, 6))
                numeric_col = num_dropdown.value
                plt.hist(df[numeric_col], bins=10, edgecolor='k')
                plt.xlabel(numeric_col)
                plt.ylabel('Frequency')
                plt.title(chart_title.value)
                plt.show()

        with output:
            clear_output(wait=True)
            print("Histogram")
            num_dropdown = select_one_num(b)
            if num_dropdown is None:
                print("No Dataframe or no numerical selected")
                return
            chart_title = widgets.Text(
                      value="My Histogram",
                      description='Title:',
                      disabled=False
                    )
            btn1 = widgets.Button(description="Generate Chart")
            btn1.on_click(f_crt_histogram)
            # time.sleep(0.1)  # Short delay to ensure rendering
            gwidget=widgets.VBox([num_dropdown, chart_title, btn1])
            display(gwidget)
    def f_scatterplot(b,output):
        with output:
            clear_output(wait=True)
            print("Scatterplot")
            if df is None:
                print("No data frame")
                return
            df_numeric = df.select_dtypes(include=np.number)
            num_cols = df_numeric.select_dtypes(include=['number']).columns
            if len(num_cols) < 2:
                print("Not enough numerical columns")
                return
            print("Correlation Matrix:")
            display(df_numeric.corr()) # Display the correlation matrix

            sns.heatmap(df_numeric.corr(), annot=True, cmap='coolwarm')
            plt.show()
            sns.pairplot(df_numeric)
            plt.show()

    def f_regr(b, formula=None,dependent_dropdown=None, independent_dropdown=None):
        with output2:
            clear_output()
            if formula is None:
                formula = f"{dependent_dropdown.value} ~ {' + '.join(independent_dropdown.value)}"
                dependent_var = dependent_dropdown.value
            else:
                match = re.match(r'\s*([^\s~]+)\s*~', formula)
                if match:
                    dependent_var = match.group(1)
                else:
                    print("Invalid formula format.")
                    return

            try:
                model = smf.ols(formula=formula, data=df).fit()
                # print(model.summary())
                rmse = np.sqrt(model.mse_resid)
                regression_summary = pd.DataFrame({
                  'R-squared': [model.rsquared],
                  'Adj. R-squared': [model.rsquared_adj],
                  'Std Error of Estimate': [rmse]
                  # 'F-statistic': [model.fvalue],
                  # 'Prob (F-statistic)': [model.f_pvalue]
                }, index=['Summary Statistics'])
                print("\nModel Summary:\n", regression_summary.to_string(index=False)) # Added to_string() with index=False

                print("\nANOVA")
                print(f"{'Source':20}{'df':10}{'SS':15}{'MS':8}{'F-value':10}{'p-value':12}")
                print(f"{'Regression':20}{model.df_model:3.0f}{model.mse_model*model.df_model:12.1f}{model.mse_model:15.2f}{model.fvalue:10.2f}{model.f_pvalue:10.2f}")
                print(f"{'Error':20}{model.df_resid:3.0f}{model.ssr:12.1f}{model.mse_resid:15.2f}")
                print(f"{'Total':20}{model.nobs-1:3.0f}{model.mse_model*model.df_model+model.ssr:12.1f}")

                coef_df = pd.DataFrame({
                  'Coefficients': model.params,
                  'Standard Errors': model.bse,
                  't-Statistic': model.tvalues,
                  'p-Value': model.pvalues
                })
                print("\nRegression Coefficients:\n", coef_df)
                print("---")
                print("Dependent variable:", dependent_var)
            except Exception as e:
                print(f"Error running regression: {e}")

    def f_reg1(b,output):
          with output:
            clear_output(wait=True)
            print("Regression 1st order")
            dependent_dropdown = select_one_num(b)
            if dependent_dropdown is None:
                print("No Dataframe or no numerical selected")
                return
            independent_dropdown = widgets.SelectMultiple(
                options=df.columns,
                description='Independent Variables:',
                disabled=False
            )
            regr_button = widgets.Button(description="Run regression")
            gwidget=widgets.VBox([dependent_dropdown, independent_dropdown,regr_button])
            display(gwidget)
            regr_button.on_click(lambda b: f_regr(b,None, dependent_dropdown, independent_dropdown))
    def f_reg2(b,output):
        with output:
            clear_output(wait=True)
            print("Regression 2nd order, type the formula")
            print(df.columns.to_list())
            formula_input = widgets.Text(value="", description='Formula')
            regr_button = widgets.Button(description="Run regression")
            gwidget=widgets.VBox([formula_input, regr_button])
            display(gwidget)

            regr_button.on_click(lambda b: f_regr(b, formula_input.value))

    ########### end of general custom functions
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
    ######################
    # Read me tab #
    with children[0]:
      print("Py Commader v1")
      print('Author: Hongyanto Setio')
      print("First created: JAN-01-2025")
      print("Last update: APR-05-2025\n\n")
      print('Few times, buttons disappeared. Try to Restartsession under Runtime menu of colab. Then run again the script')
      print("Use AS-IS, NO ANY CLAIM ")
    #######################
    # Dataframe tab #
    with children[1]:
        local_button = widgets.Button(description="Read Local CSV")
        external_button = widgets.Button(description="Read External CSV")
        url_dropdown = widgets.Dropdown(
          options=['Select One']+list(url_map.keys()),
          description='Select url:',
        )
    #
        def on_change(change):
          if change['type'] == 'change' and change['name'] == 'value':
            selected = change['new']
            if selected == 'Select One':
                with output1:
                    clear_output()
                    print("Please select a dataset.")
            else:
                url = url_map[selected]
                global df
                df = pd.read_csv(url)
                with output1:
                    clear_output()
                    print("data set from select url:")
                    display(df.head())
                    with output2:
                        clear_output()
        url_dropdown.observe(on_change)
    #
        local_button.on_click(lambda b: f_read_local_csv(b, output1))
        external_button.on_click(lambda b: f_read_external_csv(b, output1))

        # Create a VBox to hold the buttons and apply styling directly to it
        button_container = widgets.VBox([local_button, external_button, url_dropdown], layout=widgets.Layout(margin='0 0 0 15ch'))
        display(button_container)
    #### end of Dataframe tab ####
    # Dataframe Description tab#
    with children[2]:
        pie_button = widgets.Button(description="Pie chart")
        histogram_button = widgets.Button(description="Histogram")
        scatter_button = widgets.Button(description="Scatter plot")

        pie_button.on_click(lambda b: f_piechart(b, output1))
        histogram_button.on_click(lambda b: f_histogram(b, output1))
        scatter_button.on_click(lambda b: f_scatterplot(b, output1))

        gwidget=widgets.VBox([pie_button, histogram_button, scatter_button], layout=widgets.Layout(margin='0 0 0 35ch'))
        display(gwidget)
    #### end of Dataframe tab ####
    # Regression tab#
    with children[3]:
        reg1_button = widgets.Button(description="Regression (1st order)",
                                        layout=widgets.Layout(width='155px')
                      )
        reg2_button = widgets.Button(description="Regression (2nd order)",
                                        layout=widgets.Layout(width='155px')
                      )

        reg1_button.on_click(lambda b: f_reg1(b, output1))
        reg2_button.on_click(lambda b: f_reg2(b, output1))

        gwidget=widgets.VBox([reg1_button, reg2_button], layout=widgets.Layout(margin='0 0 0 55ch'))
        display(gwidget)
    ######## end of regession tab #####
