import PropTypes from 'prop-types';
import { Row, Col, Card } from 'antd'

import AWAuthor from './AWAuthor'

const AWAbstract = ({ article }) => {

  //const [article, setArticle] = useState(featureArticle);
  //const assetURL = 'https://agwater.org/' + link;


  const overlayStyle = {
    position: 'absolute',
    top: '70%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: '0px',
    //borderRadius: '5px',
  };

  const containerStyle = {
    position: 'relative',
    display: 'inline-block',
  };

  return (
    <div className='full-width' style={{ backgroundColor: 'lightgray' }}>

      {!article && (<span>No Article Available</span>)}
      {article && (

        <Card hoverable style={{backgroundColor:'#C4D6A4'}}>
          <Row>
            <Col span={10}>
              <div style={containerStyle} >
                <img src={article.cover_image} style={{ width: '100%', height: 'auto' }} />
                <div className='full-width' style={overlayStyle} >
                  <div className='padded'>{article.title}</div>
                </div>
              </div>
            </Col>
            <Col span={14} style={{ paddingLeft: '1em', paddingRight: '0.25em', paddingTop: '0.25em' }} >
              <p className="aw-dark-text no-margin" style={{ fontSize: 'small' }}>{article.subtitle}</p>
              <hr className="no-margin no-padding" />
              <div className="" style={{ padding: '0em' }}>
                <AWAuthor name={article.lead_author} site={article.site} avatar={article.avatar} />
              </div>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  )
};


AWAbstract.propTypes = {
  article: PropTypes.object,
}

export default AWAbstract;



/*

<template>
  <q-item style="padding-left:0">

  <q-card class="aw-abstract" @click="$emit('abstract_clicked',  article)">
    <div class="row">
      <div class="col-6 aw-light-bg">
        <q-img :src="article.cover_image">
          <div class="absolute-bottom">
            <div style="font-size:large">{{article.title}}</div>
          </div>
        </q-img>
      </div>
      <div class="col-6" style="padding-left:1em;padding-right:0.25em;">
        <p class="aw-dark-text">{{article.subtitle}}</p>
        <hr/>
        <div class="aw-dark-bg aw-light-text" style="padding:0.5em">
          <AWAuthor :name="article.lead_author" :site="article.site" :avatar="article.avatar"></AWAuthor>
        </div>

      </div>
    </div>
  </q-card>
  </q-item>
</template>

<script setup>
  import { ref } from 'vue'
  import AWAuthor from "components/AWAuthor.vue";

  defineProps({ article: Object });
  defineEmits(['abstract_clicked'])
</script>


<style scoped>

  .aw-abstract {
    width: 100%;
    padding: 1em;
  }

  .author {
    color: black;
  }

  h7 {
    font-size: smaller;
  }

  h8 {
    font-size: small;
  }
</style>
*/